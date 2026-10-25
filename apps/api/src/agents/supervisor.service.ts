import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ModelProvider, validateEvidenceOutput } from './agent.types';

export const MODEL_PROVIDER = Symbol('MODEL_PROVIDER');

export type EvidenceRunResult =
  | { ok: true; runId: string; claimCount: number }
  | { ok: false; runId: string; reason: 'needs_human_review' | 'provider_failed' };

// Deterministic workflow code, not a free-roaming model. Slice 1 runs only the Evidence agent.
@Injectable()
export class SupervisorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(MODEL_PROVIDER) private readonly model: ModelProvider,
  ) {}

  async runEvidenceAgent(params: { tenantId: string; applicationId: string; input: unknown }): Promise<EvidenceRunResult> {
    const { tenantId, applicationId, input } = params;
    const promptVersion = 'evidence-v0';
    const inputHash = createHash('sha256').update(JSON.stringify(input)).digest('hex');

    let raw: unknown;
    try {
      raw = await this.model.complete({ agent: 'evidence', promptVersion, input });
    } catch (err) {
      // Only a fixed code is kept: provider error text can echo request content.
      const runId = await this.logRun(tenantId, applicationId, promptVersion, inputHash, 'FAILED', 'PROVIDER_ERROR');
      return { ok: false, runId, reason: 'provider_failed' };
    }

    const result = validateEvidenceOutput(raw);
    if (!result.ok) {
      // Rejected output is not stored: it can contain candidate text. The sanitized reason is enough to diagnose.
      const runId = await this.logRun(tenantId, applicationId, promptVersion, inputHash, 'REJECTED', result.reason);
      return { ok: false, runId, reason: 'needs_human_review' };
    }

    return this.prisma.withTenant(tenantId, async (tx) => {
      const run = await tx.agentRun.create({
        data: { tenantId, applicationId, agent: 'evidence', modelId: this.model.modelId, promptVersion, inputHash, output: result.output as object, status: 'SUCCEEDED' },
      });
      await tx.evidenceItem.createMany({
        data: result.output.claims.map((c) => ({
          tenantId,
          applicationId,
          claim: c.claim,
          status: c.status,
          sourceDocumentId: c.sourceDocumentId,
          sourceExcerpt: c.sourceExcerpt,
          agentRunId: run.id,
        })),
      });
      await this.audit.record(tx, { tenantId, actorType: 'AGENT', action: 'evidence.extracted', entityType: 'application', entityId: applicationId, meta: { runId: run.id, claims: result.output.claims.length } });
      return { ok: true as const, runId: run.id, claimCount: result.output.claims.length };
    });
  }

  private logRun(tenantId: string, applicationId: string, promptVersion: string, inputHash: string, status: 'REJECTED' | 'FAILED', error: string) {
    return this.prisma.withTenant(tenantId, async (tx) => {
      const run = await tx.agentRun.create({
        data: { tenantId, applicationId, agent: 'evidence', modelId: this.model.modelId, promptVersion, inputHash, status, error },
      });
      await this.audit.record(tx, { tenantId, actorType: 'AGENT', action: `evidence.${status.toLowerCase()}`, entityType: 'application', entityId: applicationId, meta: { runId: run.id } });
      return run.id;
    });
  }
}

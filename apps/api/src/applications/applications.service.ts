import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DecisionType } from '@prisma/client';
import { SupervisorService } from '../agents/supervisor.service';
import { AuditService } from '../audit/audit.service';
import { toPage } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { statusForDecision } from './decision';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly supervisor: SupervisorService,
  ) {}

  list(tenantId: string, jobId: string, page: { limit: number; cursor?: string }) {
    return this.prisma.withTenant(tenantId, async (tx) => {
      const rows = await tx.application.findMany({
        where: { jobId },
        take: page.limit + 1,
        ...(page.cursor ? { cursor: { id: page.cursor }, skip: 1 } : {}),
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: { id: true, status: true, createdAt: true, applicant: { select: { fullName: true } } },
      });
      return toPage(rows, page.limit);
    });
  }

  // Another tenant's application is invisible under row-level security, so it simply reads as not found.
  async get(tenantId: string, id: string) {
    const application = await this.prisma.withTenant(tenantId, (tx) =>
      tx.application.findUnique({
        where: { id },
        include: {
          applicant: { select: { fullName: true, email: true, phone: true } },
          evidence: { orderBy: { createdAt: 'asc' } },
          decisions: { orderBy: { createdAt: 'desc' } },
        },
      }),
    );
    if (!application) throw new NotFoundException('Application not found');
    return application;
  }

  async runEvidence(tenantId: string, userId: string, applicationId: string) {
    const application = await this.prisma.withTenant(tenantId, async (tx) => {
      const found = await tx.application.findUnique({ where: { id: applicationId }, include: { profile: true } });
      if (found) {
        await this.audit.record(tx, { tenantId, actorType: 'USER', actorId: userId, action: 'evidence.requested', entityType: 'application', entityId: applicationId });
      }
      return found;
    });
    if (!application) throw new NotFoundException('Application not found');

    // CV text is untrusted data. It is passed as input, never as instructions.
    return this.supervisor.runEvidenceAgent({
      tenantId,
      applicationId,
      input: { cvText: application.cvText ?? '', answers: application.answers, criteria: application.profile.criteria },
    });
  }

  // Only a signed-in human can record a decision; the decider id always comes from the verified session.
  decide(tenantId: string, userId: string, applicationId: string, type: DecisionType, reason: string) {
    return this.prisma.withTenant(tenantId, async (tx) => {
      const application = await tx.application.findUnique({ where: { id: applicationId } });
      if (!application) throw new NotFoundException('Application not found');
      if (application.status === 'WITHDRAWN') throw new ConflictException('The candidate withdrew this application');

      const decision = await tx.decision.create({ data: { tenantId, applicationId, decidedById: userId, type, reason } });
      const status = statusForDecision(type, application.status);
      if (status !== application.status) await tx.application.update({ where: { id: applicationId }, data: { status } });
      await this.audit.record(tx, { tenantId, actorType: 'USER', actorId: userId, action: 'decision.recorded', entityType: 'application', entityId: applicationId, meta: { decisionId: decision.id, type } });
      return { decision, status };
    });
  }
}

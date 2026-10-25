import { z } from 'zod';

export const EvidenceStatusSchema = z.enum(['VERIFIED', 'SUPPORTED', 'INFERRED', 'UNKNOWN', 'CONTRADICTORY']);

export const EvidenceClaimSchema = z
  .object({
    claim: z.string().min(1).max(1000),
    status: EvidenceStatusSchema,
    sourceDocumentId: z.string().uuid().optional(),
    sourceExcerpt: z.string().max(2000).default(''),
  })
  .refine((c) => c.status === 'UNKNOWN' || c.sourceExcerpt.trim().length > 0, {
    message: 'A claim that is not UNKNOWN must cite a source excerpt',
  });

export const EvidenceOutputSchema = z.object({
  claims: z.array(EvidenceClaimSchema).max(200),
});

export type EvidenceOutput = z.infer<typeof EvidenceOutputSchema>;

// Provider-neutral model interface. Real providers and test mocks both implement it.
export interface ModelProvider {
  readonly modelId: string;
  complete(request: { agent: string; promptVersion: string; input: unknown }): Promise<unknown>;
}

export type ValidationResult =
  | { ok: true; output: EvidenceOutput }
  | { ok: false; reason: string };

// The supervisor accepts only schema-valid, sourced output; anything else goes to human review.
export function validateEvidenceOutput(raw: unknown): ValidationResult {
  const parsed = EvidenceOutputSchema.safeParse(raw);
  if (parsed.success) return { ok: true, output: parsed.data };
  // Only issue paths and codes: schema messages can echo the rejected value, which may be candidate text.
  const reason = parsed.error.issues.slice(0, 10).map((i) => `${i.path.join('.') || 'root'}:${i.code}`).join(';').slice(0, 500);
  return { ok: false, reason };
}

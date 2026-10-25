import { z } from 'zod';
import { normalizePhone } from './contact';

export const CONSENT_PURPOSE = 'application_processing_and_ai_assisted_evaluation';

// Sized so the worst case fits inside MAX_BODY_BYTES (see the spec). Raise both together, never one alone.
export const ApplyBody = z
  .object({
    fullName: z.string().trim().min(1).max(200),
    email: z.string().trim().email().max(254).transform((s) => s.toLowerCase()).optional(),
    phone: z
      .string()
      .trim()
      .min(7)
      .max(20)
      .regex(/^\+?[0-9 ()-]+$/)
      .transform(normalizePhone)
      .refine((p) => p.replace(/\D/g, '').length >= 7, { message: 'Phone number is too short' })
      .optional(),
    cvText: z.string().max(20000).optional(),
    answers: z.array(z.object({ question: z.string().max(300), answer: z.string().max(2000) })).max(20).default([]),
    // Explicit consent to a specific, published notice version. The server checks the version and records its hash.
    consent: z.object({ granted: z.literal(true), noticeVersion: z.string().trim().min(1).max(40) }),
  })
  .refine((b) => b.email || b.phone, { message: 'Provide an email or a phone number' });

export type ApplyInput = z.infer<typeof ApplyBody>;

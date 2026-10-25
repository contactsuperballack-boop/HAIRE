import { z } from 'zod';

const Criterion = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  weight: z.number().int().min(1).max(10),
});

const uniqueNames = (list: { name: string }[]) =>
  new Set(list.map((c) => c.name.toLowerCase())).size === list.length;

export const CriteriaSchema = z
  .object({
    mustHave: z.array(Criterion).min(1).max(30),
    preferred: z.array(Criterion).max(30).default([]),
    assessmentDimensions: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
    constraints: z
      .object({
        location: z.string().trim().max(200).optional(),
        workMode: z.enum(['ONSITE', 'HYBRID', 'REMOTE']).optional(),
        schedule: z.string().trim().max(200).optional(),
      })
      .default({}),
  })
  .refine((c) => uniqueNames([...c.mustHave, ...c.preferred]), { message: 'Criterion names must be unique' });

export type Criteria = z.infer<typeof CriteriaSchema>;

export const CreateJobBody = z.object({ title: z.string().trim().min(2).max(200) });
export const CreateProfileBody = z.object({ criteria: CriteriaSchema });

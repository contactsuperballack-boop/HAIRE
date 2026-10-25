import { CriteriaSchema } from './profile.schema';

const valid = { mustHave: [{ name: 'Communication', weight: 8 }], preferred: [{ name: 'CRM familiarity', weight: 4 }] };

describe('CriteriaSchema', () => {
  it('accepts a valid profile and fills defaults', () => {
    const r = CriteriaSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.assessmentDimensions).toEqual([]);
  });

  it('requires at least one must-have criterion', () => {
    expect(CriteriaSchema.safeParse({ mustHave: [] }).success).toBe(false);
  });

  it('rejects out-of-range weights', () => {
    expect(CriteriaSchema.safeParse({ mustHave: [{ name: 'A', weight: 0 }] }).success).toBe(false);
    expect(CriteriaSchema.safeParse({ mustHave: [{ name: 'A', weight: 11 }] }).success).toBe(false);
  });

  it('rejects duplicate criterion names across lists, ignoring case', () => {
    const r = CriteriaSchema.safeParse({ mustHave: [{ name: 'CRM', weight: 5 }], preferred: [{ name: 'crm', weight: 2 }] });
    expect(r.success).toBe(false);
  });
});

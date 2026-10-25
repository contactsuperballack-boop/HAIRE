import { statusForDecision } from './decision';

describe('statusForDecision', () => {
  it('shortlists on ADVANCE and rejects on REJECT', () => {
    expect(statusForDecision('ADVANCE', 'APPLIED')).toBe('SHORTLISTED');
    expect(statusForDecision('REJECT', 'SCREENING')).toBe('REJECTED');
  });

  it('leaves the status unchanged on HOLD', () => {
    expect(statusForDecision('HOLD', 'SCREENING')).toBe('SCREENING');
  });
});

import { validateEvidenceOutput } from './agent.types';

describe('validateEvidenceOutput', () => {
  it('accepts sourced claims', () => {
    const r = validateEvidenceOutput({
      claims: [{ claim: 'Four years in customer service', status: 'SUPPORTED', sourceExcerpt: 'Customer Service Rep, 2021-2025' }],
    });
    expect(r.ok).toBe(true);
  });

  it('accepts UNKNOWN claims without a source', () => {
    const r = validateEvidenceOutput({ claims: [{ claim: 'Weekend availability', status: 'UNKNOWN' }] });
    expect(r.ok).toBe(true);
  });

  it('rejects a non-UNKNOWN claim with no source excerpt', () => {
    const r = validateEvidenceOutput({ claims: [{ claim: 'Holds a certification', status: 'VERIFIED', sourceExcerpt: '  ' }] });
    expect(r.ok).toBe(false);
  });

  it('rejects output that is not in the expected shape', () => {
    expect(validateEvidenceOutput('free text').ok).toBe(false);
    expect(validateEvidenceOutput({ claims: [{ claim: '', status: 'MAYBE' }] }).ok).toBe(false);
  });

  it('keeps rejected candidate text out of the reason', () => {
    const r = validateEvidenceOutput({ claims: [{ claim: 'x', status: 'SECRET-CV-TEXT-123' }] });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).not.toContain('SECRET-CV-TEXT-123');
      expect(r.reason).toContain('claims.0.status');
    }
  });
});

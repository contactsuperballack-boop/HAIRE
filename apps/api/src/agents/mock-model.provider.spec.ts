import { validateEvidenceOutput } from './agent.types';
import { MockModelProvider } from './mock-model.provider';

const criteria = { mustHave: [{ name: 'customer service' }, { name: 'CRM' }], preferred: [{ name: 'Excel' }] };

describe('MockModelProvider', () => {
  const provider = new MockModelProvider();

  it('marks keyword mentions INFERRED with an excerpt and missing items UNKNOWN', async () => {
    const raw = await provider.complete({ input: { cvText: 'Four years of Customer Service and CRM support at a bank.', criteria } });
    const result = validateEvidenceOutput(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const byClaim = Object.fromEntries(result.output.claims.map((c) => [c.claim, c.status]));
    expect(byClaim['Mentions customer service']).toBe('INFERRED');
    expect(byClaim['Mentions CRM']).toBe('INFERRED');
    expect(byClaim['Excel']).toBe('UNKNOWN');
  });

  it('never claims VERIFIED', async () => {
    const raw = (await provider.complete({ input: { cvText: 'customer service CRM Excel', criteria } })) as { claims: { status: string }[] };
    expect(raw.claims.every((c) => c.status !== 'VERIFIED')).toBe(true);
  });
});

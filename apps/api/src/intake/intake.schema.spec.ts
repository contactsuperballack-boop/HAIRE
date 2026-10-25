import { MAX_BODY_BYTES } from '../common/limits';
import { ApplyBody } from './intake.schema';

const base = { fullName: 'Ada Obi', email: 'Ada@Example.com', consent: { granted: true, noticeVersion: 'v1-draft' } };

describe('ApplyBody', () => {
  it('accepts an application and lowercases the email', () => {
    const r = ApplyBody.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('ada@example.com');
  });

  it('normalizes phone numbers', () => {
    const r = ApplyBody.safeParse({ fullName: 'Ada', phone: '0801 234 5678', consent: base.consent });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.phone).toBe('+2348012345678');
  });

  it('refuses applications without explicit consent', () => {
    expect(ApplyBody.safeParse({ ...base, consent: { granted: false, noticeVersion: 'v1-draft' } }).success).toBe(false);
    expect(ApplyBody.safeParse({ fullName: 'Ada', email: 'a@b.com' }).success).toBe(false);
  });

  it('needs an email or a phone number', () => {
    expect(ApplyBody.safeParse({ fullName: 'Ada', consent: base.consent }).success).toBe(false);
  });

  it('rejects oversized CV text and too many answers', () => {
    expect(ApplyBody.safeParse({ ...base, cvText: 'x'.repeat(20001) }).success).toBe(false);
    const answers = Array.from({ length: 21 }, () => ({ question: 'q', answer: 'a' }));
    expect(ApplyBody.safeParse({ ...base, answers }).success).toBe(false);
  });

  it('fits the largest accepted application inside the request body limit', () => {
    // '€' is one character to the schema but three bytes in UTF-8, so this is the worst case.
    const euro = (n: number) => '€'.repeat(n);
    const largest = {
      fullName: euro(200),
      email: `${'a'.repeat(64)}@${'b'.repeat(180)}.com`,
      phone: '+' + '1'.repeat(19),
      cvText: euro(20000),
      answers: Array.from({ length: 20 }, () => ({ question: euro(300), answer: euro(2000) })),
      consent: { granted: true, noticeVersion: 'v1-draft' },
    };
    expect(ApplyBody.safeParse(largest).success).toBe(true);
    expect(Buffer.byteLength(JSON.stringify(largest))).toBeLessThan(MAX_BODY_BYTES);
  });
});

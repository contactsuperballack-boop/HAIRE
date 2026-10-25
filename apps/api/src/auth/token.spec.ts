import { hashToken, newSessionToken } from './token';

describe('session tokens', () => {
  it('hashes deterministically and never stores the raw token', () => {
    const { token, tokenHash } = newSessionToken();
    expect(hashToken(token)).toBe(tokenHash);
    expect(tokenHash).not.toContain(token);
  });

  it('issues unique tokens', () => {
    expect(newSessionToken().token).not.toBe(newSessionToken().token);
  });
});

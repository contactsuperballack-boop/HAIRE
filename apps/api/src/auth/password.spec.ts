import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  it('verifies the right password and rejects a wrong one', async () => {
    const stored = await hashPassword('correct horse battery staple');
    expect(await verifyPassword('correct horse battery staple', stored)).toBe(true);
    expect(await verifyPassword('wrong password', stored)).toBe(false);
  }, 30_000);

  it('uses a different salt each time', async () => {
    const [a, b] = await Promise.all([hashPassword('same'), hashPassword('same')]);
    expect(a).not.toEqual(b);
  }, 30_000);

  it('returns false for malformed stored hashes instead of throwing', async () => {
    expect(await verifyPassword('x', 'plaintext')).toBe(false);
    expect(await verifyPassword('x', 'scrypt$abc$8$1$salt$hash')).toBe(false);
    expect(await verifyPassword('x', 'scrypt$99999999999$8$1$c2FsdA==$aGFzaA==')).toBe(false);
  });
});

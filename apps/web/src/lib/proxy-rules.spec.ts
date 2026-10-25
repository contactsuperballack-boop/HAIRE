import { isAllowedPath, isSameOrigin } from './proxy-rules';

describe('proxy rules', () => {
  it('allows the console and candidate API areas', () => {
    expect(isAllowedPath(['jobs'])).toBe(true);
    expect(isAllowedPath(['jobs', 'abc', 'profiles'])).toBe(true);
    expect(isAllowedPath(['public', 'jobs', 'abc', 'apply'])).toBe(true);
    expect(isAllowedPath(['auth', 'tenant'])).toBe(true);
    expect(isAllowedPath(['applications', 'abc', 'decision'])).toBe(true);
  });

  it('blocks login, logout, health and traversal', () => {
    expect(isAllowedPath(['auth', 'login'])).toBe(false);
    expect(isAllowedPath(['auth', 'logout'])).toBe(false);
    expect(isAllowedPath(['health'])).toBe(false);
    expect(isAllowedPath(['jobs', '..', 'auth', 'login'])).toBe(false);
    expect(isAllowedPath(['jobsx'])).toBe(false);
  });

  it('accepts only a matching Origin', () => {
    expect(isSameOrigin('https://app.example.com', 'app.example.com')).toBe(true);
    expect(isSameOrigin('https://evil.example.com', 'app.example.com')).toBe(false);
    expect(isSameOrigin(null, 'app.example.com')).toBe(false);
    expect(isSameOrigin('not a url', 'app.example.com')).toBe(false);
  });
});

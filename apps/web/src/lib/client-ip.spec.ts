import { forwardedForHeaders } from './client-ip';

describe('forwardedForHeaders', () => {
  it('passes a plausible address list through unchanged', () => {
    expect(forwardedForHeaders('203.0.113.7, 10.0.0.2')).toEqual({ 'x-forwarded-for': '203.0.113.7, 10.0.0.2' });
    expect(forwardedForHeaders('2001:db8::1')).toEqual({ 'x-forwarded-for': '2001:db8::1' });
  });

  it('drops missing or malformed values', () => {
    expect(forwardedForHeaders(null)).toEqual({});
    expect(forwardedForHeaders('')).toEqual({});
    expect(forwardedForHeaders('1.2.3.4\r\nX-Evil: 1')).toEqual({});
    expect(forwardedForHeaders('<script>')).toEqual({});
    expect(forwardedForHeaders('1'.repeat(300))).toEqual({});
  });
});

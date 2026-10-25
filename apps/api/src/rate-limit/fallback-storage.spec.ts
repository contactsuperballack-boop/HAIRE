import { FallbackThrottlerStorage } from './fallback-storage';

const record = (totalHits: number) => ({ totalHits, timeToExpire: 60, isBlocked: false, timeToBlockExpire: 0 });
const call = (s: FallbackThrottlerStorage) => s.increment('k', 60_000, 5, 0, 'default');

describe('FallbackThrottlerStorage', () => {
  it('uses the shared store when it is healthy', async () => {
    const primary = { increment: jest.fn().mockResolvedValue(record(1)) };
    const fallback = { increment: jest.fn() };
    const storage = new FallbackThrottlerStorage(primary, fallback);
    expect((await call(storage)).totalHits).toBe(1);
    expect(fallback.increment).not.toHaveBeenCalled();
  });

  it('falls back to memory when the shared store throws, and reports once', async () => {
    const primary = { increment: jest.fn().mockRejectedValue(new Error('connect ECONNREFUSED redis://secret@host')) };
    const fallback = { increment: jest.fn().mockResolvedValue(record(3)) };
    const report = jest.fn();
    const storage = new FallbackThrottlerStorage(primary, fallback, report);
    expect((await call(storage)).totalHits).toBe(3);
    await call(storage);
    expect(report).toHaveBeenCalledTimes(1);
    expect(report.mock.calls[0][0]).not.toContain('secret');
  });

  it('falls back when the shared store hangs', async () => {
    const primary = { increment: jest.fn().mockReturnValue(new Promise(() => undefined)) };
    const fallback = { increment: jest.fn().mockResolvedValue(record(2)) };
    const storage = new FallbackThrottlerStorage(primary, fallback, undefined, 20);
    expect((await call(storage)).totalHits).toBe(2);
  });
});

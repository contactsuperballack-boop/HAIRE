import type { ThrottlerStorage } from '@nestjs/throttler';

type Increment = ThrottlerStorage['increment'];

// Rate limits live in Redis so every API instance shares one count. If Redis is slow or down, fall back to
// per-instance memory instead of failing every request (fail open, degraded) and say so, at most once a minute.
export class FallbackThrottlerStorage implements ThrottlerStorage {
  private lastReport = 0;

  constructor(
    private readonly primary: ThrottlerStorage,
    private readonly fallback: ThrottlerStorage,
    private readonly report: (message: string) => void = () => undefined,
    private readonly timeoutMs = 500,
  ) {}

  async increment(...args: Parameters<Increment>): ReturnType<Increment> {
    try {
      return await this.withTimeout(this.primary.increment(...args));
    } catch (err) {
      this.reportOnce(err);
      return this.fallback.increment(...args);
    }
  }

  private withTimeout<T>(work: Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('rate-limit store timed out')), this.timeoutMs);
      work.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (err) => {
          clearTimeout(timer);
          reject(err);
        },
      );
    });
  }

  private reportOnce(err: unknown) {
    const now = Date.now();
    if (now - this.lastReport < 60_000) return;
    this.lastReport = now;
    // Error name only: messages can contain connection strings.
    this.report(`Redis rate-limit store unavailable, using per-instance memory (${err instanceof Error ? err.name : 'error'})`);
  }
}

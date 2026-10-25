import { Logger } from '@nestjs/common';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ThrottlerModuleOptions, ThrottlerStorageService } from '@nestjs/throttler';
import Redis from 'ioredis';
import { env } from '../config/env';
import { FallbackThrottlerStorage } from './fallback-storage';

export function createThrottlerOptions(): ThrottlerModuleOptions {
  const logger = new Logger('RateLimit');
  // Fail fast instead of queuing commands while Redis is unreachable, so requests are never held up by the limiter.
  const redis = new Redis(env.REDIS_URL, {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    commandTimeout: 500,
  });
  // Connection errors surface as failed increments, which the fallback storage reports once a minute.
  redis.on('error', () => undefined);

  return {
    throttlers: [{ ttl: 60_000, limit: 100 }],
    storage: new FallbackThrottlerStorage(
      new ThrottlerStorageRedisService(redis),
      new ThrottlerStorageService(),
      (message) => logger.warn(message),
    ),
  };
}

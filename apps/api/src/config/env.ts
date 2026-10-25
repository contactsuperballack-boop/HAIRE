import { z } from 'zod';

// Load apps/api/.env when present (Node 22+). Real environment variables always win. Production uses real env vars.
try {
  process.loadEnvFile();
} catch {
  // no .env file: rely on the process environment
}

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    // Number of trusted proxy hops in front of the API (0 = none). In this deployment the web app is one hop, so 1.
    // Never use a blanket 'true': clients could then forge their IP and dodge rate limits.
    TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
    // 'mock' is a keyword matcher for development. A real provider is added once one is chosen.
    MODEL_PROVIDER: z.enum(['mock']).default('mock'),
  })
  .refine((e) => !(e.NODE_ENV === 'production' && e.MODEL_PROVIDER === 'mock'), {
    message: 'The mock model provider cannot run in production',
  });

// Fails fast at startup with a readable list of what is missing or malformed.
export const env = schema.parse(process.env);

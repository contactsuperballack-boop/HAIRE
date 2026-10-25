import 'reflect-metadata';
import { Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { MAX_BODY_BYTES } from './common/limits';
import { env } from './config/env';

async function bootstrap() {
  // Default body parser off so the size limit below is explicit rather than an inherited default.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.useBodyParser('json', { limit: MAX_BODY_BYTES });
  // Rate limits key on the client IP, so the API must know how many proxies sit in front of it.
  app.set('trust proxy', env.TRUST_PROXY);
  if (env.NODE_ENV === 'production' && env.TRUST_PROXY === 0) {
    new Logger('Bootstrap').warn('TRUST_PROXY is 0 in production: behind a proxy, every client shares one rate limit.');
  }
  app.use(helmet());
  app.enableVersioning({ type: VersioningType.URI });
  await app.listen(env.PORT);
}

void bootstrap();

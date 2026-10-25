import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { ContextInterceptor } from './auth/context.interceptor';
import { JobsModule } from './jobs/jobs.module';
import { IntakeModule } from './intake/intake.module';
import { ApplicationsModule } from './applications/applications.module';
import { createThrottlerOptions } from './rate-limit/rate-limit.config';
import { HealthController } from './health/health.controller';

// Guard order matters: throttle first, then authenticate, then check roles.
@Module({
  imports: [ThrottlerModule.forRootAsync({ useFactory: createThrottlerOptions }), PrismaModule, AuditModule, AuthModule, JobsModule, IntakeModule, ApplicationsModule],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: ContextInterceptor },
  ],
})
export class AppModule {}

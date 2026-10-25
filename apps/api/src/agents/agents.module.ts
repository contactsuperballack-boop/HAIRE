import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { env } from '../config/env';
import { MockModelProvider } from './mock-model.provider';
import { MODEL_PROVIDER, SupervisorService } from './supervisor.service';

@Module({
  imports: [AuditModule],
  providers: [
    SupervisorService,
    {
      provide: MODEL_PROVIDER,
      useFactory: () => {
        if (env.MODEL_PROVIDER === 'mock') return new MockModelProvider();
        throw new Error(`Unsupported MODEL_PROVIDER: ${env.MODEL_PROVIDER}`);
      },
    },
  ],
  exports: [SupervisorService],
})
export class AgentsModule {}

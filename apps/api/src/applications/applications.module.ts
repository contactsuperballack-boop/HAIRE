import { Module } from '@nestjs/common';
import { AgentsModule } from '../agents/agents.module';
import { AuditModule } from '../audit/audit.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

@Module({ imports: [AuditModule, AgentsModule], controllers: [ApplicationsController], providers: [ApplicationsService] })
export class ApplicationsModule {}

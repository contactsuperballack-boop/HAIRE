import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query, Req } from '@nestjs/common';
import { z } from 'zod';
import type { AuthedRequest } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { READERS, STAFF } from '../auth/role-groups';
import { PageQuery } from '../common/pagination';
import { parse, scope } from '../common/validate';
import { ApplicationsService } from './applications.service';

const DecisionBody = z.object({
  type: z.enum(['ADVANCE', 'REJECT', 'HOLD']),
  reason: z.string().trim().min(3).max(2000),
});

@Controller({ version: '1' })
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Roles(...READERS)
  @Get('jobs/:jobId/applications')
  list(@Req() req: AuthedRequest, @Param('jobId', ParseUUIDPipe) jobId: string, @Query() query: unknown) {
    return this.applications.list(scope(req).tenantId, jobId, parse(PageQuery, query));
  }

  @Roles(...READERS)
  @Get('applications/:id')
  get(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.applications.get(scope(req).tenantId, id);
  }

  @Roles(...STAFF)
  @Post('applications/:id/evidence/run')
  @HttpCode(200)
  runEvidence(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const { tenantId, userId } = scope(req);
    return this.applications.runEvidence(tenantId, userId, id);
  }

  // Hiring managers read but do not decide in this slice; their approval step arrives with shortlists.
  @Roles(...STAFF)
  @Post('applications/:id/decision')
  @HttpCode(201)
  decide(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    const { tenantId, userId } = scope(req);
    const { type, reason } = parse(DecisionBody, body);
    return this.applications.decide(tenantId, userId, id, type, reason);
  }
}

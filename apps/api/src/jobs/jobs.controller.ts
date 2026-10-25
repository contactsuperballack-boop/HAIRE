import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query, Req } from '@nestjs/common';
import type { AuthedRequest } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { ADMINS, READERS, STAFF } from '../auth/role-groups';
import { PageQuery } from '../common/pagination';
import { parse, scope } from '../common/validate';
import { JobsService } from './jobs.service';
import { CreateJobBody, CreateProfileBody } from './profile.schema';

@Controller({ version: '1' })
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Roles(...STAFF)
  @Post('jobs')
  create(@Req() req: AuthedRequest, @Body() body: unknown) {
    const { tenantId, userId } = scope(req);
    return this.jobs.create(tenantId, userId, parse(CreateJobBody, body).title);
  }

  @Roles(...READERS)
  @Get('jobs')
  list(@Req() req: AuthedRequest, @Query() query: unknown) {
    return this.jobs.list(scope(req).tenantId, parse(PageQuery, query));
  }

  @Roles(...READERS)
  @Get('jobs/:id')
  get(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.jobs.get(scope(req).tenantId, id);
  }

  @Roles(...ADMINS)
  @Post('jobs/:id/open')
  @HttpCode(200)
  open(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const { tenantId, userId } = scope(req);
    return this.jobs.open(tenantId, userId, id);
  }

  @Roles(...STAFF)
  @Post('jobs/:jobId/profiles')
  createProfile(@Req() req: AuthedRequest, @Param('jobId', ParseUUIDPipe) jobId: string, @Body() body: unknown) {
    const { tenantId, userId } = scope(req);
    return this.jobs.createProfile(tenantId, userId, jobId, parse(CreateProfileBody, body).criteria);
  }

  @Roles(...READERS)
  @Get('jobs/:jobId/profiles')
  listProfiles(@Req() req: AuthedRequest, @Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.jobs.listProfiles(scope(req).tenantId, jobId);
  }

  @Roles(...ADMINS)
  @Post('profiles/:id/approve')
  @HttpCode(200)
  approveProfile(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const { tenantId, userId } = scope(req);
    return this.jobs.approveProfile(tenantId, userId, id);
  }
}

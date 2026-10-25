import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/public.decorator';
import { parse } from '../common/validate';
import { ApplyBody } from './intake.schema';
import { IntakeService } from './intake.service';

// Candidate-facing and unauthenticated, so it is tightly rate limited and returns the minimum.
@Public()
@Throttle({ default: { limit: 10, ttl: 60_000 } })
@Controller({ path: 'public/jobs', version: '1' })
export class IntakeController {
  constructor(private readonly intake: IntakeService) {}

  @Get(':jobId')
  job(@Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.intake.publicJob(jobId);
  }

  @Post(':jobId/apply')
  @HttpCode(201)
  apply(@Param('jobId', ParseUUIDPipe) jobId: string, @Body() body: unknown) {
    return this.intake.apply(jobId, parse(ApplyBody, body));
  }
}

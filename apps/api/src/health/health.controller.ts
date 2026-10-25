import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';

@Controller({ path: 'health', version: '1' })
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: 'ok' };
  }
}

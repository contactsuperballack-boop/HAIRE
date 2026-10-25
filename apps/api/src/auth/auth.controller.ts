import { BadRequestException, Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { AuthService } from './auth.service';
import type { AuthedRequest } from './auth.guard';
import { Public } from './public.decorator';

const LoginBody = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(256) });
const TenantBody = z.object({ tenantId: z.string().uuid() });

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new BadRequestException('Invalid request body');
  return result.data;
}

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  login(@Body() body: unknown) {
    const { email, password } = parse(LoginBody, body);
    return this.auth.login(email, password);
  }

  @Post('tenant')
  @HttpCode(200)
  selectTenant(@Req() req: AuthedRequest, @Body() body: unknown) {
    const { tenantId } = parse(TenantBody, body);
    return this.auth.selectTenant(req.auth!, tenantId);
  }

  @Get('me')
  me(@Req() req: AuthedRequest) {
    const { userId, tenantId, role } = req.auth!;
    return { userId, tenantId, role };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: AuthedRequest) {
    await this.auth.logout(req.auth!);
  }
}

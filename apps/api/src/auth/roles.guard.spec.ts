import 'reflect-metadata';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

class Sample {
  @Roles('RECRUITER', 'EMPLOYER_ADMIN')
  restricted() {}

  open() {}
}

function ctx(handler: () => void, auth: unknown): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => Sample,
    switchToHttp: () => ({ getRequest: () => ({ auth }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());
  const s = new Sample();

  it('allows a listed role', () => {
    expect(guard.canActivate(ctx(s.restricted, { tenantId: 't', role: 'RECRUITER' }))).toBe(true);
  });

  it('forbids an unlisted role', () => {
    expect(() => guard.canActivate(ctx(s.restricted, { tenantId: 't', role: 'HIRING_MANAGER' }))).toThrow(ForbiddenException);
  });

  it('forbids a user with no active workspace', () => {
    expect(() => guard.canActivate(ctx(s.restricted, { tenantId: null, role: null }))).toThrow(ForbiddenException);
  });

  it('does not restrict routes without @Roles', () => {
    expect(guard.canActivate(ctx(s.open, { tenantId: null, role: null }))).toBe(true);
  });
});

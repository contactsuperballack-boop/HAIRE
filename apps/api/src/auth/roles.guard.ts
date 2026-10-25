import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MemberRole } from '@prisma/client';
import type { AuthedRequest } from './auth.guard';
import { ROLES_KEY } from './roles.decorator';

// Runs after AuthGuard. Roles are checked on the server for every protected action; the UI is never the control.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<MemberRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles) return true;

    const auth = context.switchToHttp().getRequest<AuthedRequest>().auth;
    if (!auth?.tenantId || !auth.role || !roles.includes(auth.role)) {
      throw new ForbiddenException();
    }
    return true;
  }
}

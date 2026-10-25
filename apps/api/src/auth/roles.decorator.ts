import { SetMetadata } from '@nestjs/common';
import { MemberRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
// Requires an active workspace and one of the listed roles.
export const Roles = (...roles: MemberRole[]) => SetMetadata(ROLES_KEY, roles);

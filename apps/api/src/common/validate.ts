import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { z } from 'zod';
import type { AuthedRequest } from '../auth/auth.guard';

export function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new BadRequestException({ message: 'Invalid request', issues: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) });
  }
  return result.data;
}

// Role guards already require an active workspace; this narrows the types and fails closed if it is ever missing.
export function scope(req: AuthedRequest): { tenantId: string; userId: string } {
  const auth = req.auth;
  if (!auth?.tenantId) throw new ForbiddenException();
  return { tenantId: auth.tenantId, userId: auth.userId };
}

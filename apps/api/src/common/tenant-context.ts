import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  tenantId: string;
  userId: string;
}

// Populated by the auth guard (next slice) after it verifies the session and the user's membership.
export const requestContext = new AsyncLocalStorage<RequestContext>();

export function currentContext(): RequestContext {
  const ctx = requestContext.getStore();
  if (!ctx) throw new Error('No request context: tenant-scoped code ran outside an authenticated request');
  return ctx;
}

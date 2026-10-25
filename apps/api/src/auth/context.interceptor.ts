import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { requestContext } from '../common/tenant-context';
import type { AuthedRequest } from './auth.guard';

// Makes the verified tenant and user available to tenant-scoped code for the whole request.
@Injectable()
export class ContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auth = context.switchToHttp().getRequest<AuthedRequest>().auth;
    if (!auth?.tenantId) return next.handle();
    const store = { tenantId: auth.tenantId, userId: auth.userId };
    return new Observable((subscriber) => requestContext.run(store, () => next.handle().subscribe(subscriber)));
  }
}

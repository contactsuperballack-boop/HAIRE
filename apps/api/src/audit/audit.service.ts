import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export interface AuditEntry {
  tenantId: string;
  actorType: 'USER' | 'AGENT' | 'SYSTEM';
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  meta?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  // Takes the caller's transaction so the audit row commits or rolls back with the action it records.
  // Never put passwords, tokens or unnecessary personal data in meta.
  record(tx: Prisma.TransactionClient, entry: AuditEntry) {
    return tx.auditLog.create({
      data: { ...entry, meta: entry.meta ?? {} },
    });
  }
}

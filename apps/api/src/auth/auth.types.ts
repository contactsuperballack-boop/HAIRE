import { MemberRole } from '@prisma/client';

export interface AuthContext {
  sessionId: string;
  userId: string;
  // Null until the user selects a workspace, or if their membership was removed since.
  tenantId: string | null;
  role: MemberRole | null;
}

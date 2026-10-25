import type { ApplicationStatus, DecisionType } from '@prisma/client';

// Humans decide. ADVANCE shortlists, REJECT rejects, HOLD leaves the status unchanged.
export function statusForDecision(type: DecisionType, current: ApplicationStatus): ApplicationStatus {
  if (type === 'ADVANCE') return 'SHORTLISTED';
  if (type === 'REJECT') return 'REJECTED';
  return current;
}

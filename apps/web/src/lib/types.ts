export type Role = 'AGENCY_ADMIN' | 'EMPLOYER_ADMIN' | 'RECRUITER' | 'HIRING_MANAGER';
export const ADMIN_ROLES: Role[] = ['EMPLOYER_ADMIN', 'AGENCY_ADMIN'];
export const STAFF_ROLES: Role[] = [...ADMIN_ROLES, 'RECRUITER'];

export interface Me { userId: string; tenantId: string | null; role: Role | null }
export interface Membership { tenantId: string; tenantName: string; role: Role }
export interface Page<T> { items: T[]; nextCursor: string | null }
export interface Job { id: string; title: string; status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'ARCHIVED'; createdAt: string }
export interface Criterion { name: string; description?: string; weight: number }
export interface Criteria {
  mustHave: Criterion[];
  preferred: Criterion[];
  assessmentDimensions: string[];
  constraints: { location?: string; workMode?: 'ONSITE' | 'HYBRID' | 'REMOTE'; schedule?: string };
}
export interface Profile { id: string; version: number; status: 'DRAFT' | 'APPROVED' | 'SUPERSEDED'; criteria: Criteria; approvedAt: string | null }
export interface ApplicationRow { id: string; status: string; createdAt: string; applicant: { fullName: string } }
export type EvidenceStatus = 'VERIFIED' | 'SUPPORTED' | 'INFERRED' | 'UNKNOWN' | 'CONTRADICTORY';
export interface Evidence { id: string; claim: string; status: EvidenceStatus; sourceExcerpt: string }
export interface DecisionRow { id: string; type: 'ADVANCE' | 'REJECT' | 'HOLD'; reason: string; createdAt: string }
export interface ApplicationDetail {
  id: string; status: string; createdAt: string; cvText: string | null;
  answers: { question: string; answer: string }[];
  applicant: { fullName: string; email: string | null; phone: string | null };
  evidence: Evidence[]; decisions: DecisionRow[];
}

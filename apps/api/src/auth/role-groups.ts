import { MemberRole } from '@prisma/client';

// Agency admins manage jobs inside the client workspaces they belong to, so they sit with employer admins.
export const ADMINS: MemberRole[] = ['EMPLOYER_ADMIN', 'AGENCY_ADMIN'];
export const STAFF: MemberRole[] = [...ADMINS, 'RECRUITER'];
export const READERS: MemberRole[] = [...STAFF, 'HIRING_MANAGER'];

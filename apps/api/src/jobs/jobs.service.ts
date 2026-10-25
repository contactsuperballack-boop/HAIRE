import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { toPage } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { Criteria } from './profile.schema';

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  create(tenantId: string, userId: string, title: string) {
    return this.prisma.withTenant(tenantId, async (tx) => {
      const job = await tx.job.create({ data: { tenantId, title, createdById: userId } });
      await this.audit.record(tx, { tenantId, actorType: 'USER', actorId: userId, action: 'job.created', entityType: 'job', entityId: job.id });
      return job;
    });
  }

  list(tenantId: string, page: { limit: number; cursor?: string }) {
    return this.prisma.withTenant(tenantId, async (tx) => {
      const rows = await tx.job.findMany({
        take: page.limit + 1,
        ...(page.cursor ? { cursor: { id: page.cursor }, skip: 1 } : {}),
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      });
      return toPage(rows, page.limit);
    });
  }

  async get(tenantId: string, id: string) {
    const job = await this.prisma.withTenant(tenantId, (tx) => tx.job.findUnique({ where: { id } }));
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  // A job can only open once a Hiring Profile has been approved by an admin.
  open(tenantId: string, userId: string, id: string) {
    return this.prisma.withTenant(tenantId, async (tx) => {
      const job = await tx.job.findUnique({ where: { id } });
      if (!job) throw new NotFoundException('Job not found');
      if (job.status !== 'DRAFT') throw new ConflictException('Only draft jobs can be opened');
      const approved = await tx.hiringProfile.findFirst({ where: { jobId: id, status: 'APPROVED' } });
      if (!approved) throw new ConflictException('Approve a Hiring Profile before opening the job');
      const updated = await tx.job.update({ where: { id }, data: { status: 'OPEN' } });
      await this.audit.record(tx, { tenantId, actorType: 'USER', actorId: userId, action: 'job.opened', entityType: 'job', entityId: id });
      return updated;
    });
  }

  async createProfile(tenantId: string, userId: string, jobId: string, criteria: Criteria) {
    try {
      return await this.prisma.withTenant(tenantId, async (tx) => {
        const job = await tx.job.findUnique({ where: { id: jobId } });
        if (!job) throw new NotFoundException('Job not found');
        const last = await tx.hiringProfile.findFirst({ where: { jobId }, orderBy: { version: 'desc' } });
        const profile = await tx.hiringProfile.create({
          data: { tenantId, jobId, version: (last?.version ?? 0) + 1, criteria: criteria as Prisma.InputJsonValue },
        });
        await this.audit.record(tx, { tenantId, actorType: 'USER', actorId: userId, action: 'profile.created', entityType: 'hiring_profile', entityId: profile.id, meta: { version: profile.version } });
        return profile;
      });
    } catch (err) {
      // Two people creating a version at once: the unique (jobId, version) constraint stops the second.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Another version was created at the same time. Try again.');
      }
      throw err;
    }
  }

  listProfiles(tenantId: string, jobId: string) {
    return this.prisma.withTenant(tenantId, (tx) => tx.hiringProfile.findMany({ where: { jobId }, orderBy: { version: 'desc' } }));
  }

  // Approved profiles are immutable: changes mean a new version. Approving supersedes the previous approved one.
  // The job row is locked first so two approvals for the same job run one after the other, and a partial unique
  // index (rls.sql) guarantees at most one APPROVED profile per job even if this code is ever bypassed.
  async approveProfile(tenantId: string, userId: string, profileId: string) {
    try {
      return await this.prisma.withTenant(tenantId, async (tx) => {
        const found = await tx.hiringProfile.findUnique({ where: { id: profileId } });
        if (!found) throw new NotFoundException('Profile not found');
        await tx.$queryRaw`SELECT id FROM jobs WHERE id = ${found.jobId}::uuid FOR UPDATE`;

        // Re-read after taking the lock: another approval may have finished while we waited.
        const profile = await tx.hiringProfile.findUnique({ where: { id: profileId } });
        if (!profile) throw new NotFoundException('Profile not found');
        if (profile.status !== 'DRAFT') throw new ConflictException('Only draft profiles can be approved');

        await tx.hiringProfile.updateMany({ where: { jobId: profile.jobId, status: 'APPROVED' }, data: { status: 'SUPERSEDED' } });
        const approved = await tx.hiringProfile.update({ where: { id: profileId }, data: { status: 'APPROVED', approvedById: userId, approvedAt: new Date() } });
        await this.audit.record(tx, { tenantId, actorType: 'USER', actorId: userId, action: 'profile.approved', entityType: 'hiring_profile', entityId: profileId, meta: { version: profile.version } });
        return approved;
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Another approval for this job was in progress. Try again.');
      }
      throw err;
    }
  }
}

import { BadRequestException, ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { ApplyInput, CONSENT_PURPOSE } from './intake.schema';
import { CURRENT_NOTICE, Notice, getNotice, noticeHash, publicNotice } from './notices';

interface PublicJob {
  id: string;
  tenant_id: string;
  title: string;
  status: string;
}

// One neutral message for every duplicate case, so the form does not confirm whether an email has applied.
const DUPLICATE_MESSAGE = 'We could not accept this application. If you applied before, you do not need to apply again.';

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

@Injectable()
export class IntakeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // Public requests have no tenant yet. This SQL function (see rls.sql) is the only door that resolves a job id to its tenant.
  private async findOpenJob(jobId: string): Promise<PublicJob> {
    const rows = await this.prisma.$queryRaw<PublicJob[]>`SELECT id, tenant_id, title, status FROM public_job_lookup(${jobId}::uuid)`;
    const job = rows[0];
    if (!job || job.status !== 'OPEN') throw new NotFoundException('Job not found');
    return job;
  }

  // The page shows the notice from here, so the wording a candidate sees is the wording the server records.
  async publicJob(jobId: string) {
    const job = await this.findOpenJob(jobId);
    return { title: job.title, notice: publicNotice(CURRENT_NOTICE) };
  }

  async apply(jobId: string, input: ApplyInput) {
    const notice = getNotice(input.consent.noticeVersion);
    if (!notice) throw new BadRequestException('Unknown consent notice version');
    if (env.NODE_ENV === 'production' && !notice.legalApproved) {
      throw new ServiceUnavailableException('Applications are not open yet');
    }
    const job = await this.findOpenJob(jobId);

    // A simultaneous submission with the same email can lose the race on the unique index. Retry once: the retry
    // then finds the other request's applicant and reports a duplicate cleanly.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await this.createApplication(job.tenant_id, jobId, input, notice);
        return { received: true };
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
        if (attempt === 1) throw new ConflictException(DUPLICATE_MESSAGE);
      }
    }
    throw new ConflictException(DUPLICATE_MESSAGE);
  }

  private createApplication(tenantId: string, jobId: string, input: ApplyInput, notice: Notice) {
    return this.prisma.withTenant(tenantId, async (tx) => {
      const profile = await tx.hiringProfile.findFirst({ where: { jobId, status: 'APPROVED' } });
      if (!profile) throw new NotFoundException('Job not found');

      // Identity is matched on email only (unique per tenant in the database). A phone number is contact
      // information: someone else typing it must never attach them to another person's record.
      const existing = input.email ? await tx.applicant.findFirst({ where: { email: input.email } }) : null;
      const applicant =
        existing ?? (await tx.applicant.create({ data: { tenantId, fullName: input.fullName, email: input.email, phone: input.phone } }));

      const duplicate = await tx.application.findUnique({ where: { jobId_applicantId: { jobId, applicantId: applicant.id } } });
      if (duplicate) throw new ConflictException(DUPLICATE_MESSAGE);

      await tx.consentRecord.create({
        data: {
          tenantId,
          applicantId: applicant.id,
          purpose: CONSENT_PURPOSE,
          noticeVersion: notice.version,
          noticeHash: noticeHash(notice),
          grantedAt: new Date(),
        },
      });
      const application = await tx.application.create({
        data: { tenantId, jobId, applicantId: applicant.id, profileId: profile.id, cvText: input.cvText, answers: input.answers as Prisma.InputJsonValue },
      });
      // Audit meta carries ids only, never the applicant's personal details.
      await this.audit.record(tx, { tenantId, actorType: 'SYSTEM', action: 'application.created', entityType: 'application', entityId: application.id, meta: { jobId, noticeVersion: notice.version } });
    });
  }
}

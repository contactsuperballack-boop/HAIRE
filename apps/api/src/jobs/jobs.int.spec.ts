import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { JobsService } from './jobs.service';

// Integration test: needs the Docker database with migrations and rls.sql applied, and DATABASE_URL pointing at haire_app.
// Run with: RUN_DB_TESTS=1 npm test
const run = process.env.RUN_DB_TESTS ? describe : describe.skip;

run('profile approval concurrency', () => {
  const prisma = new PrismaService();
  const jobs = new JobsService(prisma, new AuditService());
  const criteria = { mustHave: [{ name: 'Communication', weight: 5 }], preferred: [], assessmentDimensions: [], constraints: {} };
  let tenantId = '';
  let userId = '';
  let jobId = '';

  beforeAll(async () => {
    await prisma.$connect();
    tenantId = (await prisma.tenant.create({ data: { name: 'Concurrency test', type: 'EMPLOYER' } })).id;
    userId = (await prisma.user.create({ data: { email: `conc-${Date.now()}@example.com`, name: 'Conc', passwordHash: 'x' } })).id;
    jobId = (await jobs.create(tenantId, userId, 'Concurrency role')).id;
  });

  afterAll(async () => {
    await prisma.withTenant(tenantId, async (tx) => {
      await tx.hiringProfile.deleteMany({ where: { jobId } });
      await tx.job.deleteMany({ where: { id: jobId } });
    });
    await prisma.$disconnect();
  });

  it('leaves exactly one approved profile when two drafts are approved at once', async () => {
    const a = await jobs.createProfile(tenantId, userId, jobId, criteria);
    const b = await jobs.createProfile(tenantId, userId, jobId, criteria);

    const results = await Promise.allSettled([
      jobs.approveProfile(tenantId, userId, a.id),
      jobs.approveProfile(tenantId, userId, b.id),
    ]);

    expect(results.some((r) => r.status === 'fulfilled')).toBe(true);
    const approved = await prisma.withTenant(tenantId, (tx) => tx.hiringProfile.count({ where: { jobId, status: 'APPROVED' } }));
    expect(approved).toBe(1);
  });
});

import { PrismaClient } from '@prisma/client';

// Integration test: needs the Docker database with migrations and rls.sql applied, and DATABASE_URL pointing at haire_app.
// Run with: RUN_DB_TESTS=1 npm test
const run = process.env.RUN_DB_TESTS ? describe : describe.skip;

run('tenant isolation (row-level security)', () => {
  const prisma = new PrismaClient();
  let tenantA = '';
  let tenantB = '';
  let jobA = '';

  const asTenant = <T>(tenantId: string, fn: Parameters<PrismaClient['$transaction']>[0]) =>
    prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
      return (fn as (t: typeof tx) => Promise<T>)(tx);
    });

  beforeAll(async () => {
    tenantA = (await prisma.tenant.create({ data: { name: 'Isolation A', type: 'EMPLOYER' } })).id;
    tenantB = (await prisma.tenant.create({ data: { name: 'Isolation B', type: 'EMPLOYER' } })).id;
    const user = await prisma.user.create({ data: { email: `iso-${Date.now()}@example.com`, name: 'Iso', passwordHash: 'x' } });
    jobA = (await asTenant<{ id: string }>(tenantA, (tx) => tx.job.create({ data: { tenantId: tenantA, title: 'Secret role', createdById: user.id } }))).id;
  });

  afterAll(async () => {
    await asTenant(tenantA, (tx) => tx.job.deleteMany({ where: { id: jobA } }));
    await prisma.$disconnect();
  });

  it('lets a tenant read its own rows', async () => {
    const rows = await asTenant<unknown[]>(tenantA, (tx) => tx.job.findMany());
    expect(rows.length).toBeGreaterThan(0);
  });

  it('hides another tenant\'s rows', async () => {
    const rows = await asTenant<unknown[]>(tenantB, (tx) => tx.job.findMany({ where: { id: jobA } }));
    expect(rows).toHaveLength(0);
  });

  it('blocks writing rows into another tenant', async () => {
    await expect(
      asTenant(tenantB, (tx) => tx.job.create({ data: { tenantId: tenantA, title: 'Injected', createdById: '00000000-0000-0000-0000-000000000000' } })),
    ).rejects.toThrow();
  });

  it('returns nothing when no tenant is set', async () => {
    const rows = await prisma.job.findMany({ where: { id: jobA } });
    expect(rows).toHaveLength(0);
  });
});

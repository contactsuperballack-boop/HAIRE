// Development seed: one employer workspace and one admin user, so you can sign in.
// Usage: npm run db:seed -w apps/api
// Optional: SEED_EMAIL, SEED_PASSWORD, SEED_TENANT. If no password is given, a random one is generated and printed once.
import { randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/auth/password';

try {
  process.loadEnvFile();
} catch {
  // no .env file: rely on the process environment
}

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed in production');

  const email = (process.env.SEED_EMAIL ?? 'admin@example.com').trim().toLowerCase();
  const tenantName = process.env.SEED_TENANT ?? 'Demo Employer';
  const generated = !process.env.SEED_PASSWORD;
  const password = process.env.SEED_PASSWORD ?? randomBytes(12).toString('base64url');
  if (password.length < 12) throw new Error('SEED_PASSWORD must be at least 12 characters');

  const prisma = new PrismaClient();
  try {
    const tenant =
      (await prisma.tenant.findFirst({ where: { name: tenantName, type: 'EMPLOYER' } })) ??
      (await prisma.tenant.create({ data: { name: tenantName, type: 'EMPLOYER' } }));
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, name: 'Demo Admin', passwordHash },
    });
    await prisma.membership.upsert({
      where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
      update: { role: 'EMPLOYER_ADMIN' },
      create: { userId: user.id, tenantId: tenant.id, role: 'EMPLOYER_ADMIN' },
    });

    console.log(`Workspace: ${tenantName}`);
    console.log(`Email:     ${email}`);
    console.log(`Password:  ${password}${generated ? '   (generated, shown once)' : ''}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthContext } from './auth.types';
import { hashPassword, verifyPassword } from './password';
import { hashToken, newSessionToken } from './token';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private dummyHash?: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { memberships: { include: { tenant: { select: { name: true } } } } },
    });
    // Verify against a dummy hash when the user is unknown, so response time does not reveal which emails exist.
    this.dummyHash ??= hashPassword('not-a-real-password');
    const ok = await verifyPassword(password, user?.passwordHash ?? (await this.dummyHash));
    if (!user || !ok) throw new UnauthorizedException('Invalid email or password');

    const { token, tokenHash } = newSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await this.prisma.session.create({ data: { userId: user.id, tokenHash, expiresAt } });
    return {
      token,
      expiresAt,
      memberships: user.memberships.map((m) => ({ tenantId: m.tenantId, tenantName: m.tenant.name, role: m.role })),
    };
  }

  async authenticate(token: string): Promise<AuthContext | null> {
    const session = await this.prisma.session.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) return null;

    if (!session.activeTenantId) {
      return { sessionId: session.id, userId: session.userId, tenantId: null, role: null };
    }
    // Re-check membership on every request so removing a member takes effect immediately.
    const membership = await this.prisma.membership.findUnique({
      where: { userId_tenantId: { userId: session.userId, tenantId: session.activeTenantId } },
    });
    return {
      sessionId: session.id,
      userId: session.userId,
      tenantId: membership ? membership.tenantId : null,
      role: membership ? membership.role : null,
    };
  }

  async selectTenant(auth: AuthContext, tenantId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_tenantId: { userId: auth.userId, tenantId } },
    });
    if (!membership) throw new ForbiddenException('You are not a member of that workspace');

    await this.prisma.session.update({ where: { id: auth.sessionId }, data: { activeTenantId: tenantId } });
    await this.prisma.withTenant(tenantId, (tx) =>
      this.audit.record(tx, {
        tenantId,
        actorType: 'USER',
        actorId: auth.userId,
        action: 'auth.tenant_selected',
        entityType: 'session',
        entityId: auth.sessionId,
      }),
    );
    return { tenantId, role: membership.role };
  }

  async logout(auth: AuthContext) {
    await this.prisma.session.update({ where: { id: auth.sessionId }, data: { revokedAt: new Date() } });
  }
}

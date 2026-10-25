# HAIRE

AI-native hiring intelligence for Nigeria and Africa. This repository holds the platform, built in vertical slices (see the Engineering Discovery Pack).

## Status

Foundation scaffold. Written without network access, so `npm install`, type checks, lint, tests and the build have **not yet been run**. First step on any machine: run the commands below and fix whatever they report.

## Requirements

Node 22+, npm 10+, Docker.

## Setup

```bash
docker compose up -d                     # Postgres 16 and Redis
cp .env.example apps/api/.env            # development values only
npm install
npx prisma generate --schema apps/api/prisma/schema.prisma
npm run db:migrate -w apps/api -- --name init
npm run db:rls -w apps/api               # row-level security, constraints, audit immutability
npm run db:seed -w apps/api              # creates a demo workspace and admin; prints the login once
npm run api:dev                          # http://localhost:3001/v1/health
cp apps/web/.env.example apps/web/.env.local
npm run web:dev                          # http://localhost:3000
```

## Checks

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

## Layout

- `apps/api`: NestJS API, organized by domain. Includes tenancy-aware Prisma access, login with workspace selection and role checks, the audit log and the supervisor with the Evidence agent contract.
- `apps/web`: Next.js recruiter console and candidate application page (see below).
- `design/tokens.json`: HAIRE palette and type scale from the logo.
- `infra/postgres/init.sql`: dev-only database role. The app connects as `haire_app`, which does not bypass row-level security.

## Authentication

- Staff sign in with email and password (scrypt) and receive an opaque session token, sent as `Authorization: Bearer <token>`. Only its hash is stored.
- After login, `POST /v1/auth/tenant` selects the workspace. Membership is re-checked on every request.
- Every route requires a session unless marked `@Public()`. `@Roles(...)` restricts by role; with no workspace selected, role-restricted routes return 403.
- Login is rate-limited (5 per minute). There is no account until you seed one: `npm run db:seed -w apps/api` creates a demo employer workspace and admin (default email `admin@example.com`, random password printed once; override with `SEED_EMAIL`, `SEED_PASSWORD`, `SEED_TENANT`). It refuses to run in production. User invitations arrive in a later slice.
- Emails must be stored lowercase.

## Slice 1 endpoints (all under /v1)

| Endpoint | Who | Purpose |
|---|---|---|
| `POST /jobs`, `GET /jobs`, `GET /jobs/:id` | staff / readers | Create and view jobs |
| `POST /jobs/:jobId/profiles`, `GET /jobs/:jobId/profiles` | staff / readers | Draft a new Hiring Profile version |
| `POST /profiles/:id/approve` | admins | Approve a draft; supersedes the previous approved version |
| `POST /jobs/:id/open` | admins | Open a job (requires an approved profile) |
| `GET /public/jobs/:jobId`, `POST /public/jobs/:jobId/apply` | public, rate limited | Candidate application with explicit, versioned consent |
| `GET /jobs/:jobId/applications`, `GET /applications/:id` | readers | Review applicants, evidence and decisions |
| `POST /applications/:id/evidence/run` | staff | Run the Evidence agent through the supervisor |
| `POST /applications/:id/decision` | staff | Record a human decision: ADVANCE, REJECT or HOLD, with a reason |

Roles: admins are employer or agency admins; staff add recruiters; readers add hiring managers. Hiring managers read but do not decide yet.

## Notes on slice 1

- **Public intake** resolves a job to its tenant through the `public_job_lookup` SQL function in `rls.sql`. It is `SECURITY DEFINER`, so create it as the migration owner (a role with BYPASSRLS in production).
- **CVs** are submitted as text for now. File upload with object storage comes next.
- **Model provider:** `MODEL_PROVIDER=mock` is a development-only keyword matcher that returns INFERRED at best and never VERIFIED. The app refuses to start in production with it.
- **Cross-tenant requests** return 404 because row-level security hides the rows.
- **Database tests:** `RUN_DB_TESTS=1 npm test` runs tenant-isolation tests against the Docker database.

## Web app (apps/web)

- **Candidate page:** `/apply/<jobId>` is public, mobile-first and accessible. The consent notice text lives in `apps/api/src/intake/notices.ts` and is served by the API; the server accepts only published versions and stores a hash of the exact wording with each consent. The current notice is a plain-language **draft** (`legalApproved: false`): have counsel review it, then set `legalApproved: true`. Production refuses applications under unapproved notices. Never edit a published version; add a new one.
- **Recruiter console:** sign in, choose a workspace, then jobs, Hiring Profile drafting and approval, opening a job, applicants, evidence view, evidence extraction and decisions. Buttons are hidden by role, but the API enforces roles regardless.
- **Session handling:** the session token lives in an httpOnly cookie and never reaches browser JavaScript. Browser calls go through `/api/proxy/*`, which only reaches allow-listed API areas and requires a same-origin `Origin` on state-changing requests.
- **Not built yet:** shortlist view, assessments, WhatsApp intake, CV file upload, candidate status page, user invitations. Next 16 renames `middleware.ts` to `proxy.ts`; rename when upgrading.
- Written without network access, so install, type check, lint, tests and `next build` have **not** been run.

## Applicants, limits and agent records

- **Identity:** applicants are matched on email only, with a unique index per tenant. Phone numbers are normalized and stored as contact details but never used to merge people. Phone-only applicants are not de-duplicated.
- **Duplicates:** every duplicate case returns the same neutral message, and a simultaneous double submission is retried once and then reported cleanly.
- **Request size:** JSON bodies are capped at 256 KB (`src/common/limits.ts`). The apply schema is sized so its worst case fits, and a test checks it.
- **Agent records:** rejected model output and raw provider errors are not stored, only a fixed error code or sanitized issue paths. Define a retention period for agent-run data before launch.

## Rate limiting and proxies

- **Shared limits:** rate limits are stored in Redis, so all API instances count together and limits survive restarts. If Redis is slow or down, the API falls back to per-instance memory and logs a warning (at most once a minute) instead of failing requests. Alert on that warning.
- **Client IP:** limits key on the client IP. Set `TRUST_PROXY` to the number of trusted proxy hops in front of the API (the web app counts as one). Never use a blanket `true`. The API warns at startup if it is 0 in production.
- **Web to API:** the web app forwards the `X-Forwarded-For` set by your load balancer, after dropping anything that does not look like an address list. Run the web app behind a load balancer or reverse proxy that **sets** `X-Forwarded-For` (appending the real client address), or every user will share one IP and one limit.
- **Network rule:** the API must only be reachable from the web app and load balancer. If anything else can call it directly, it can forge `X-Forwarded-For`.
- **Not yet done:** per-account login lockout (the current login limit is per IP only).

## Key decisions

- **Modular monolith:** simplest safe architecture for the MVP.
- **Tenant isolation:** `tenant_id` on tenant-owned tables plus Postgres row-level security. Use `PrismaService.withTenant` for every tenant-owned query.
- **Agents:** the supervisor accepts only schema-valid output with sources; failures are recorded and routed to human review. Agents cannot write decisions.
- **Audit log:** append-only, enforced by database privileges and a trigger.

## Next

Slice 1 endpoints (login and the membership check are in place): jobs, Hiring Profile approval, application intake with consent, evidence run, recruiter evidence view and decision. Web app (Next.js) follows.

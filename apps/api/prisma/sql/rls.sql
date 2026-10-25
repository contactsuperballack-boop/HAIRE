-- Run after migrations: npm run db:rls -w apps/api
-- Row-level security: a request sees only rows whose tenant_id equals app.tenant_id,
-- which PrismaService.withTenant sets inside each transaction.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['jobs','hiring_profiles','applicants','applications','consent_records',
                           'documents','evidence_items','decisions','agent_runs','audit_logs']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid) WITH CHECK (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid)',
      t);
  END LOOP;
END $$;

-- At most one approved Hiring Profile per job, enforced by the database (Prisma cannot express partial indexes).
CREATE UNIQUE INDEX IF NOT EXISTS hiring_profiles_one_approved ON hiring_profiles (job_id) WHERE status = 'APPROVED';

-- One applicant per email within a tenant. Phone numbers are contact details, not identity, so no unique index on them.
CREATE UNIQUE INDEX IF NOT EXISTS applicants_tenant_email_unique ON applicants (tenant_id, email) WHERE email IS NOT NULL;

-- Sourced claims need an excerpt.
ALTER TABLE evidence_items DROP CONSTRAINT IF EXISTS evidence_needs_source;
ALTER TABLE evidence_items ADD CONSTRAINT evidence_needs_source
  CHECK (status = 'UNKNOWN' OR length(btrim(source_excerpt)) > 0);

-- App role privileges. The audit log is append-only.
GRANT USAGE ON SCHEMA public TO haire_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO haire_app;
REVOKE UPDATE, DELETE ON audit_logs FROM haire_app;

CREATE OR REPLACE FUNCTION audit_logs_immutable() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'audit_logs is append-only'; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS audit_logs_no_change ON audit_logs;
CREATE TRIGGER audit_logs_no_change BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_logs_immutable();

-- Public intake has no tenant yet. This function resolves a job id to its tenant and is the only
-- cross-tenant read the app role can do. SECURITY DEFINER runs as the function owner, so it must be
-- created by the migration owner (haire_owner in development; use a role with BYPASSRLS in production).
CREATE OR REPLACE FUNCTION public_job_lookup(p_job_id uuid)
RETURNS TABLE (id uuid, tenant_id uuid, title text, status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT j.id, j.tenant_id, j.title, j.status::text FROM jobs j WHERE j.id = p_job_id
$$;
REVOKE ALL ON FUNCTION public_job_lookup(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public_job_lookup(uuid) TO haire_app;

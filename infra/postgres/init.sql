-- Development only. The app connects as haire_app, a role WITHOUT superuser or BYPASSRLS,
-- so row-level security is enforced. Migrations run as haire_owner.
CREATE ROLE haire_app LOGIN PASSWORD 'haire_app_dev' NOSUPERUSER NOBYPASSRLS;
GRANT CONNECT ON DATABASE haire TO haire_app;

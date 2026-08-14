-- The landing page's one table: an email captured by WaitlistForm.svelte's POST to
-- ?/subscribe (src/routes/+page.server.ts), nothing else. This repository is the sole
-- owner of this schema. The table used to be migration 0019 in the canonry product
-- repository's packages/db, back when this page lived in that monorepo and shared its
-- database; it moved here, with its own migration, when the landing site became its
-- own repository and its own deployment - a separate deployment reaching into another
-- app's migrations to find its own table is exactly the coupling this move undid.
--
-- Apply with: pnpm migrate (see scripts/migrate.mjs and the README's "Apply the
-- migration" section).
--
-- A single flat .sql file rather than a migration framework (Drizzle, node-pg-migrate,
-- ...): this app has exactly one table and is unlikely to ever need a framework's
-- worth of machinery for a second. `if not exists` on both statements makes re-running
-- this file against a database that already has them a no-op, which is enough
-- correctness for a script with no tracking table. If a future migration cannot be
-- made idempotent this way (a column rename, a backfill), add a schema_migrations
-- table and an applied-check to scripts/migrate.mjs before reaching for a framework.

create table if not exists waitlist_signup (
	id uuid primary key default gen_random_uuid(),
	email text not null,
	created_at timestamptz not null default now()
);

create unique index if not exists waitlist_signup_email_unique on waitlist_signup (email);

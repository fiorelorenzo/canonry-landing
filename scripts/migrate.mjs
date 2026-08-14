#!/usr/bin/env node
/**
 * Applies every migrations/*.sql file, in filename order, against DATABASE_URL.
 *
 * No migrations-tracking table: every statement in migrations/ is written idempotent
 * (`create table if not exists`, `create unique index if not exists`), so re-running
 * this script against a database that already has the table is a no-op rather than an
 * error. That is enough correctness for a one-table app; if this ever grows a
 * migration that cannot be made idempotent (a column rename, a backfill), add a
 * schema_migrations table and an applied-check here before reaching for a framework.
 *
 * Usage:
 *   DATABASE_URL=postgres://user:pass@host:port/db pnpm migrate
 *
 * This is a plain node script, not run through Vite, so it does not get the .env
 * loading `vite dev`/`vite build` get for free - export DATABASE_URL or prefix the
 * command as shown above.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(here, '..', 'migrations');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	console.error('DATABASE_URL is not set, so there is nowhere to apply migrations to');
	process.exit(1);
}

const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();

if (files.length === 0) {
	console.error(`no .sql files found in ${migrationsDir}`);
	process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });

try {
	for (const file of files) {
		const text = await readFile(path.join(migrationsDir, file), 'utf8');
		console.log(`applying ${file}`);
		await sql.unsafe(text);
	}
	console.log(`applied ${files.length} migration${files.length === 1 ? '' : 's'}`);
} finally {
	await sql.end();
}

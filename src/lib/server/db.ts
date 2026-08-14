/**
 * One `postgres.js` connection for the process, reaching this app's own Postgres
 * database - its own schema, its own deployment, separate from the canonry product
 * repository's database (see AGENTS.md and this repository's README for why this
 * repository moved out of that monorepo: a separate repository and a separate
 * deployment own their own schema rather than reaching into another app's data model).
 * A raw `postgres` client rather than an ORM is deliberate too: this app has exactly
 * one table to talk to, so a schema/migration framework would cost more dependency
 * (and more licence surface) than it buys.
 *
 * `waitlist_signup` itself is not defined here: migrations/0001_waitlist_signup.sql
 * owns it (see the README for how to apply it). This client only ever runs a literal
 * insert against the name and columns that migration created.
 */
import { env } from '$env/dynamic/private';
import postgres from 'postgres';

let client: postgres.Sql | undefined;

export function sql(): postgres.Sql {
	if (client) return client;
	if (!env.DATABASE_URL) {
		throw new Error('DATABASE_URL is not set, so there is nowhere to record a signup');
	}
	client = postgres(env.DATABASE_URL, { max: 5 });
	return client;
}

/**
 * Liveness/readiness probe for docker/compose.yml's healthcheck, the deploy health
 * gate and CI's post-boot check. Opens its own single connection rather than reaching
 * into `$lib/server/db`'s shared handle, so this keeps answering even if the rest of
 * the app is misconfigured.
 */
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import postgres from 'postgres';
import type { RequestHandler } from './$types';

let client: postgres.Sql | undefined;

function getClient(): postgres.Sql | undefined {
	if (client) return client;
	if (!env.DATABASE_URL) return undefined;
	client = postgres(env.DATABASE_URL, { max: 1 });
	return client;
}

async function checkPostgres(): Promise<boolean> {
	const instance = getClient();
	if (!instance) return false;
	try {
		await instance`select 1`;
		return true;
	} catch {
		return false;
	}
}

export const GET: RequestHandler = async () => {
	const dbOk = await checkPostgres();

	return json(
		{
			status: dbOk ? 'ok' : 'down',
			version: env.APP_VERSION ?? 'unknown',
			commit: env.APP_COMMIT ?? 'unknown',
			db: dbOk
		},
		{ status: dbOk ? 200 : 503 }
	);
};

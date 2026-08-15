/**
 * The waiting list's one action, on the Italian path. `handleSubscribe` (`$lib/server/
 * waitlist.ts`) does the real work and is shared byte-for-byte with `/`'s own
 * `+page.server.ts` (issue #129) - this file is a one-line wrapper supplying the
 * connection, because SvelteKit resolves `actions` per route and there is no way to
 * point two routes at one action file directly.
 */
import { sql } from '$lib/server/db';
import { handleSubscribe } from '$lib/server/waitlist';
import type { Actions } from './$types';

export const actions: Actions = {
	subscribe: ({ request }) => handleSubscribe(sql(), request)
};

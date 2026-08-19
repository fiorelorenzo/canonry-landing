/**
 * The waiting list's one action, on the English path. `handleSubscribe` (`$lib/server/
 * waitlist.ts`) does the real work and is shared byte-for-byte with `/it`'s own
 * `+page.server.ts` (issue #129) - this file supplies the connection, the locale, and
 * the request's own origin (issue #8's confirmation link is built from it), because
 * SvelteKit resolves `actions` per route and there is no way to point two routes at one
 * action file directly.
 */
import { sql } from '$lib/server/db';
import { handleSubscribe } from '$lib/server/waitlist';
import type { Actions } from './$types';

export const actions: Actions = {
	subscribe: ({ request, url }) => handleSubscribe(sql(), request, 'en', url.origin)
};

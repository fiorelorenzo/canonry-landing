/**
 * The waiting list's one action. `sql()`/`subscribe()` do the real work; this file
 * only translates a form submission into their inputs and their result into what
 * `WaitlistForm.svelte` renders. Duplicate email comes back as `{ ok: true }` from
 * `subscribe` itself, so there is no special-casing here - this route cannot tell a
 * first signup from a repeat one, on purpose.
 */
import { fail } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { subscribe } from '$lib/server/waitlist';
import type { Actions } from './$types';

export const actions: Actions = {
	subscribe: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email');
		if (typeof email !== 'string' || email.trim() === '') {
			return fail(400, { ok: false, error: 'Enter an email address.' });
		}

		const result = await subscribe(sql(), email);
		if (!result.ok) {
			return fail(400, { ok: false, error: result.error });
		}
		return { ok: true };
	}
};

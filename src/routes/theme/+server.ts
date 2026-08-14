/**
 * Sets the theme cookie and redirects back to wherever the toggle form was submitted
 * from. A plain POST-redirect-GET on purpose (no `use:enhance` on the form that calls
 * this): `hooks.server.ts`'s rewrite has to see the new cookie on a fresh request for
 * the new palette to apply, and a full navigation is the simplest way to guarantee
 * that for an action a visitor takes once or twice per visit at most.
 */
import { redirect } from '@sveltejs/kit';
import { isThemePreference, THEME_COOKIE } from '$lib/theme';
import type { RequestHandler } from './$types';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export const POST: RequestHandler = async ({ request, cookies }) => {
	const data = await request.formData();
	const submitted = data.get('theme');
	const next = typeof submitted === 'string' && isThemePreference(submitted) ? submitted : 'system';
	cookies.set(THEME_COOKIE, next, { path: '/', maxAge: ONE_YEAR_SECONDS });

	const back = data.get('redirectTo');
	redirect(303, typeof back === 'string' && back.startsWith('/') ? back : '/');
};

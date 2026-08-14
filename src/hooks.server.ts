/**
 * This app has no auth and no per-user settings, so the only thing every request goes
 * through is a theme rewrite: read the cookie, turn `app.html`'s `data-theme-pref`
 * placeholder into a real `data-theme` attribute (or strip it for `system`) before the
 * response leaves the server, so the right palette is there on first paint rather than
 * flashing light-then-dark.
 */
import { parseThemePreference, THEME_COOKIE, themeAttribute } from '$lib/theme';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const preference = parseThemePreference(event.cookies.get(THEME_COOKIE));
	const attribute = themeAttribute(preference);

	return resolve(event, {
		transformPageChunk: ({ html }) =>
			attribute
				? html.replace('data-theme-pref', `data-theme="${attribute}"`)
				: html.replace(' data-theme-pref', '')
	});
};

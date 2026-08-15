/**
 * This app has no auth and no per-user settings, so every request goes through two
 * rewrites: the theme swap that already lived here (`data-theme-pref` -> a real
 * `data-theme` attribute), and, since issue #129, `<html lang>` - `app.html`'s
 * hardcoded `lang="en"` becomes the locale the URL path itself decides
 * (`localeFromPathname`, `$lib/i18n`: `/` is English, `/it` is Italian, no
 * `Accept-Language`, no cookie - the same reasoning that file's own doc comment gives
 * for why this page can't be negotiated the way the product app's chrome is).
 */
import { localeFromPathname } from '$lib/i18n';
import { parseThemePreference, THEME_COOKIE, themeAttribute } from '$lib/theme';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const preference = parseThemePreference(event.cookies.get(THEME_COOKIE));
	const attribute = themeAttribute(preference);
	const locale = localeFromPathname(event.url.pathname);

	return resolve(event, {
		transformPageChunk: ({ html }) => {
			const themed = attribute
				? html.replace('data-theme-pref', `data-theme="${attribute}"`)
				: html.replace(' data-theme-pref', '');
			return themed.replace('lang="en"', `lang="${locale}"`);
		}
	});
};

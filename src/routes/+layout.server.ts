/**
 * Resolves the theme cookie once per request. This app has no auth, so there is no
 * session data to carry alongside it.
 *
 * `url.origin` also rides along here rather than being read from an env var per
 * page: `adapter-node` rewrites every request's `url` using its own `ORIGIN`
 * variable (set to `https://canonry.io` in the deployed stack), so this is the one
 * place that turns "the site's own origin" into a value every page's head block can
 * use to build an absolute image URL, instead of each of them hardcoding the host.
 */
import { parseThemePreference, THEME_COOKIE } from '$lib/theme';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ cookies, url }) => {
	return {
		themePreference: parseThemePreference(cookies.get(THEME_COOKIE)),
		origin: url.origin
	};
};

/**
 * Resolves the theme cookie once per request. This app has no auth, so there is no
 * session data to carry alongside it.
 */
import { parseThemePreference, THEME_COOKIE } from '$lib/theme';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ cookies }) => {
	return { themePreference: parseThemePreference(cookies.get(THEME_COOKIE)) };
};

/**
 * G1 = B (docs/ux/DECISIONS.md, in the canonry product repository): dark is a
 * whole-app preference, not a table-mode skin. The product repository's web app owns
 * the canonical version of this file, plus the settings page that writes the cookie
 * for a signed-in user; this is a deliberate copy, not a shared import - this
 * repository's whole reason to exist separately is that it does not depend on the
 * product repository at all. Keeping the cookie name identical is what makes the two
 * properties agree on a visitor's palette if they ever share a parent domain, but
 * that is a nice-to-have, not a requirement this file depends on.
 *
 * Same known gap as the product app's copy: `layout.css` only defines
 * `[data-theme='dark']`, no `@media (prefers-color-scheme: dark)` fallback, so
 * `system` renders the light palette until that media query exists. This app's
 * `ThemeToggle` therefore only ever writes `light` or `dark`, never `system`, so a
 * visitor who touches the toggle always gets an explicit, working palette instead of
 * landing back on the gap.
 */

export const THEME_COOKIE = 'canonry_theme';

export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];

export function isThemePreference(value: string | null | undefined): value is ThemePreference {
	return value != null && (THEME_PREFERENCES as readonly string[]).includes(value);
}

/** A missing or unrecognised cookie behaves exactly like an explicit `system` choice. */
export function parseThemePreference(raw: string | null | undefined): ThemePreference {
	return isThemePreference(raw) ? raw : 'system';
}

/**
 * `light`/`dark` become the `data-theme` attribute written before first paint.
 * `system` resolves to `undefined`, meaning "no attribute at all", so nothing here
 * ever guesses at the browser's preference; CSS is left to decide once it can.
 */
export function themeAttribute(preference: ThemePreference): 'light' | 'dark' | undefined {
	return preference === 'system' ? undefined : preference;
}

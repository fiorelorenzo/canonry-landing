<script lang="ts">
	/**
	 * The whole reason this app needs a working dark palette at all (G1: dark is a
	 * whole-app preference, not a table-mode skin) is so this toggle can prove it.
	 * `system` renders light today (the same known CSS gap the product app's theme.ts
	 * carries), so the toggle only ever writes `light` or `dark` - a visitor who
	 * touches it always lands on an explicit, working palette rather than back on
	 * that gap.
	 *
	 * Issue #129: label text follows `locale` (from the URL path, `$lib/i18n`), same
	 * as every other piece of chrome on this site.
	 */
	import { page } from '$app/state';
	import { localeFromPathname, type Locale } from '$lib/i18n';
	import type { ThemePreference } from '$lib/theme';

	let { preference }: { preference: ThemePreference } = $props();

	let isDark = $derived(preference === 'dark');
	let next = $derived<ThemePreference>(isDark ? 'light' : 'dark');
	let locale = $derived(localeFromPathname(page.url.pathname));

	const LABEL: Record<Locale, { light: string; dark: string }> = {
		en: { light: 'Light mode', dark: 'Dark mode' },
		it: { light: 'Modalità chiara', dark: 'Modalità scura' }
	};
</script>

<form method="POST" action="/theme">
	<input type="hidden" name="theme" value={next} />
	<input type="hidden" name="redirectTo" value={page.url.pathname} />
	<button
		type="submit"
		class="rounded-md border border-line-2 px-3 py-1.5 text-xs text-ink-2 hover:bg-panel-2"
	>
		{isDark ? LABEL[locale].light : LABEL[locale].dark}
	</button>
</form>

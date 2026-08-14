<script lang="ts">
	/**
	 * The whole reason this app needs a working dark palette at all (G1: dark is a
	 * whole-app preference, not a table-mode skin) is so this toggle can prove it.
	 * `system` renders light today (the same known CSS gap the product app's theme.ts
	 * carries), so the toggle only ever writes `light` or `dark` - a visitor who
	 * touches it always lands on an explicit, working palette rather than back on
	 * that gap.
	 */
	import { page } from '$app/state';
	import type { ThemePreference } from '$lib/theme';

	let { preference }: { preference: ThemePreference } = $props();

	let isDark = $derived(preference === 'dark');
	let next = $derived<ThemePreference>(isDark ? 'light' : 'dark');
</script>

<form method="POST" action="/theme">
	<input type="hidden" name="theme" value={next} />
	<input type="hidden" name="redirectTo" value={page.url.pathname} />
	<button
		type="submit"
		class="rounded-md border border-line-2 px-3 py-1.5 text-xs text-ink-2 hover:bg-panel-2"
	>
		{isDark ? 'Light mode' : 'Dark mode'}
	</button>
</form>

<script lang="ts">
	/**
	 * Issue #129: chrome that appears on every route (the skip link, the nav, the
	 * theme toggle) follows `locale`, read from the URL path (`$lib/i18n`) - `/` is
	 * English, `/it` is Italian, nothing else decides it (no cookie, no
	 * `Accept-Language`: see `$lib/i18n`'s own doc comment on why that is the right
	 * call for a page search engines have to index once, in one language, per path).
	 * `/pricing` and `/docs/export` have no Italian counterpart yet, so the language
	 * link only appears on the two paths that actually have one.
	 */
	import './layout.css';
	import Mark from '$lib/components/Mark.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { LOCALE_NAMES, localeFromPathname, type Locale } from '$lib/i18n';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	let locale = $derived(localeFromPathname(page.url.pathname));

	const NAV: Record<Locale, { skipToContent: string; pricing: string; export: string }> = {
		en: { skipToContent: 'Skip to content', pricing: 'Pricing', export: 'Export' },
		it: { skipToContent: 'Vai al contenuto', pricing: 'Prezzi', export: 'Esportazione' }
	};
	let t = $derived(NAV[locale]);

	// Only `/` and `/it` are bilingual (issue #129's own scope: the landing page, not
	// the whole site) - everywhere else this stays undefined and no language link shows.
	let otherLocaleHref = $derived(
		page.url.pathname === '/' ? resolve('/it') : page.url.pathname === '/it' ? resolve('/') : null
	);
	let otherLocale = $derived<Locale>(locale === 'en' ? 'it' : 'en');
</script>

<a
	href="#main"
	class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-panel"
>
	{t.skipToContent}
</a>

<div class="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 pt-6">
	<a
		href={locale === 'it' ? resolve('/it') : resolve('/')}
		class="flex items-center gap-2 text-ink"
	>
		<Mark size={22} ariaHidden />
		<span class="text-lg">Canonry</span>
	</a>
	<nav class="flex items-center gap-4 text-sm">
		<a href={resolve('/pricing')} class="text-ink-2 hover:text-ink hover:underline">{t.pricing}</a>
		<a href={resolve('/docs/export')} class="text-ink-2 hover:text-ink hover:underline"
			>{t.export}</a
		>
		{#if otherLocaleHref}
			<a
				href={otherLocaleHref}
				class="text-ink-2 hover:text-ink hover:underline"
				hreflang={otherLocale}
			>
				{LOCALE_NAMES[otherLocale]}
			</a>
		{/if}
		<ThemeToggle preference={data.themePreference} />
	</nav>
</div>

{@render children()}

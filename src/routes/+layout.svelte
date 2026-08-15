<script lang="ts">
	/**
	 * Issue #129: chrome that appears on every route (the skip link, the nav, the
	 * theme toggle) follows `locale`, read from the URL path (`$lib/i18n`) - `/` is
	 * English, `/it` is Italian, nothing else decides it (no cookie, no
	 * `Accept-Language`: see `$lib/i18n`'s own doc comment on why that is the right
	 * call for a page search engines have to index once, in one language, per path).
	 * Every page under this layout now exists in both languages, so the nav's
	 * pricing/export links and the language switch both resolve against the current
	 * page rather than a single hardcoded home-page pair.
	 *
	 * Every href on this page comes from `resolve()`, never a relative string like
	 * `./pricing`: a relative href resolves against the *current* URL, so one link
	 * written once in this shared layout would land on `/pricing` from `/` but on
	 * `/it/pricing` from `/it` - right from one locale, wrong from the other, and
	 * there is no single relative string that is correct from both. `resolve()`
	 * paths are rooted at the origin, so the same call produces the same href
	 * regardless of which page is currently rendering this layout.
	 */
	import './layout.css';
	import Mark from '$lib/components/Mark.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { LOCALE_NAMES, localeFromPathname, type Locale } from '$lib/i18n';
	import type { Snippet } from 'svelte';
	import type { ResolvedPathname } from '$app/types';
	import type { LayoutData } from './$types';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	let locale = $derived(localeFromPathname(page.url.pathname));

	const NAV: Record<Locale, { skipToContent: string; pricing: string; export: string }> = {
		en: { skipToContent: 'Skip to content', pricing: 'Pricing', export: 'Export' },
		it: { skipToContent: 'Vai al contenuto', pricing: 'Prezzi', export: 'Esportazione' }
	};
	let t = $derived(NAV[locale]);

	// Every bilingual page, keyed by what it is rather than which locale it is in, next
	// to the one path per locale that serves it. The wordmark link and the nav's own
	// pricing/export links read a page's own row for the *current* locale; the language
	// switch below reads the same row for the *other* one - one table instead of a
	// hardcoded pair per page, so a page only has to be added here once.
	type PageKey = 'home' | 'pricing' | 'export';
	const PAGE_KEYS: readonly PageKey[] = ['home', 'pricing', 'export'];
	const PAGE_PATH: Record<Locale, Record<PageKey, ResolvedPathname>> = {
		en: { home: resolve('/'), pricing: resolve('/pricing'), export: resolve('/docs/export') },
		it: {
			home: resolve('/it'),
			pricing: resolve('/it/pricing'),
			export: resolve('/it/docs/export')
		}
	};

	// The reverse of PAGE_PATH: which page a pathname is, regardless of locale. Exists
	// only to answer "what page is this visitor already on" for the language switch -
	// `/healthz` and `/theme` are not in it, so the switch stays hidden there exactly as
	// it did before, since this layout never actually renders for either.
	const PAGE_KEY_BY_PATH: Record<string, PageKey> = Object.fromEntries(
		PAGE_KEYS.flatMap((key) => [
			[PAGE_PATH.en[key], key],
			[PAGE_PATH.it[key], key]
		])
	);

	let otherLocale = $derived<Locale>(locale === 'en' ? 'it' : 'en');
	let pageKey = $derived(PAGE_KEY_BY_PATH[page.url.pathname] ?? null);
	let otherLocaleHref = $derived(pageKey ? PAGE_PATH[otherLocale][pageKey] : null);
</script>

<a
	href="#main"
	class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-panel"
>
	{t.skipToContent}
</a>

<div class="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 pt-6">
	<a href={PAGE_PATH[locale].home} class="flex items-center gap-2 text-ink">
		<Mark size={22} ariaHidden />
		<span class="text-lg">Canonry</span>
	</a>
	<nav class="flex items-center gap-4 text-sm">
		<a href={PAGE_PATH[locale].pricing} class="text-ink-2 hover:text-ink hover:underline"
			>{t.pricing}</a
		>
		<a href={PAGE_PATH[locale].export} class="text-ink-2 hover:text-ink hover:underline"
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

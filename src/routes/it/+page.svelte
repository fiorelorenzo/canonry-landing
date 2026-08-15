<script lang="ts">
	/**
	 * Issue #129: the Italian landing page, on its own path, indexable in its own
	 * right rather than served from `/` behind a cookie. Structurally a mirror of
	 * `../+page.svelte` - same sections, same components - with every sentence written
	 * in Italian rather than run through a translator (this repository's AGENTS.md:
	 * "no promise of consistency, no 'unlimited', no em dashes, and the Italian is
	 * written as Italian rather than translated word for word"). `PropagationDemo` and
	 * `WaitlistForm` need no `locale` prop: both read it from the URL path themselves
	 * (`$lib/i18n`), so this file only supplies the copy that is unique to this page.
	 */
	import { resolve } from '$app/paths';
	import PropagationDemo from '$lib/components/PropagationDemo.svelte';
	import WaitlistForm from '$lib/components/WaitlistForm.svelte';
	import { OG_LOCALE } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();

	const title = 'Canonry: un wiki con un copilota che non scrive mai senza di te';
	const description =
		'Modifica una voce e Canonry ti dice quali altre voci ne risentono, prepara ogni aggiornamento e aspetta che tu lo accetti o lo scarti, una alla volta.';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />

	<!-- Issue #129: `/it` is the Italian page, `/` its English original - both directions
	     declared so a crawler indexes each path in its own language instead of picking one
	     arbitrarily. `x-default` still points at `/`, matching the English page's own tag:
	     one page can only name one default, and it has to agree with the other side. -->
	<link rel="alternate" hreflang="it" href={`${data.origin}/it`} />
	<link rel="alternate" hreflang="en" href={data.origin} />
	<link rel="alternate" hreflang="x-default" href={data.origin} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Canonry" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={`${data.origin}/it`} />
	<meta property="og:image" content={`${data.origin}/og.png`} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:locale" content={OG_LOCALE.it} />
	<meta property="og:locale:alternate" content={OG_LOCALE.en} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={`${data.origin}/og.png`} />
</svelte:head>

<main id="main" class="mx-auto max-w-3xl px-6 pt-6 pb-16">
	<!-- F6 = C: the demo is the hero, no copy above it - same rule as the English page. -->
	<p class="mb-3 text-sm text-muted">
		Canonry: un wiki con un copilota AI che non scrive mai senza di te.
	</p>

	<PropagationDemo />

	<!-- G10 = A: the lock-in answer, one sentence below the demo, linking to the docs page
	     that states it fully. That page is still English-only (out of this issue's scope);
	     the link is kept rather than dropped, matching how the rest of a bilingual launch's
	     first wave normally works. -->
	<p class="mt-3 border-t border-line pt-3 text-sm text-ink-2">
		Esporta tutto il tuo mondo in markdown, quando vuoi, dalle Impostazioni.
		<a href={resolve('/docs/export')} class="text-accent hover:underline">
			Cosa contiene il file, e cosa succede se disattivi l'AI &rarr;
		</a>
	</p>

	<section class="mt-12 grid gap-10 sm:grid-cols-2">
		<div class="max-w-measure text-sm leading-relaxed text-ink-2">
			<p>
				Circa un terzo dei master usa già un chatbot generico per condurre le proprie partite.
				Canonry è quell'abitudine con una memoria del tuo mondo: prepara bozze, segnala quello che
				non torna, e aspetta sempre un sì prima che qualcosa entri nel tuo canone.
			</p>
			<p class="mt-3">
				Preferisci fare a meno dell'AI del tutto, o vuoi solo disattivarla per un universo? La
				generazione si spegne completamente e quello che resta è comunque un buon wiki: ricerca,
				voci, relazioni ed esportazione continuano a funzionare tutte. Si ferma solo la scrittura
				delle bozze.
			</p>
		</div>

		<WaitlistForm {form} />
	</section>
</main>

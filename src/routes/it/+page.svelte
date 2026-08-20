<script lang="ts">
	/**
	 * Issue #129: the Italian landing page, on its own path, indexable in its own
	 * right rather than served from `/` behind a cookie. Structurally a mirror of
	 * `../+page.svelte` - same sections, same components - with every sentence written
	 * in Italian rather than run through a translator (this repository's AGENTS.md:
	 * "no promise of consistency, no 'unlimited', no em dashes, and the Italian is
	 * written as Italian rather than translated word for word"). `PropagationDemo` and
	 * `NewsletterForm` need no `locale` prop: both read it from the URL path themselves
	 * (`$lib/i18n`), so this file only supplies the copy that is unique to this page.
	 */
	import { resolve } from '$app/paths';
	import PropagationDemo from '$lib/components/PropagationDemo.svelte';
	import { APP_SAMPLE_WORLD_URL, APP_SIGN_UP_URL } from '$lib/app';
	import NewsletterForm from '$lib/components/NewsletterForm.svelte';
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
	     that states it fully - now this page's own Italian counterpart (`/it/docs/export`),
	     not the English original. -->
	<p class="mt-3 border-t border-line pt-3 text-sm text-ink-2">
		Esporta tutto il tuo mondo in markdown, quando vuoi, dalle Impostazioni.
		<a href={resolve('/it/docs/export')} class="text-accent hover:underline">
			Cosa contiene il file, e cosa succede se disattivi l'AI &rarr;
		</a>
	</p>

	<!-- M1 (docs/ux/DECISIONS.md, round eight): la porta d'ingresso. app.canonry.io ora
	     serve l'intero prodotto, sano, su una release taggata - il recupero password e
	     la cancellazione dell'account sono usciti entrambi in v0.8.0, la condizione che
	     questa call to action aspettava. -->
	<section
		class="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-panel p-4"
	>
		<div>
			<p class="text-sm font-medium text-ink">app.canonry.io è online.</p>
			<p class="mt-1 text-sm text-ink-2">Crea un account gratuito e inizia il tuo mondo.</p>
			<!-- Issue #15: l'altra metà di M1. Il mondo dietro questo link è nostro, e la
			     copy lo dice invece di lasciare credere a chi legge che sia la campagna di un
			     cliente. Si legge senza account perché il suo master ne ha pubblicata una
			     parte: è il wiki dei giocatori del prodotto, non una sua imitazione. -->
			<p class="mt-2 text-sm text-ink-2">
				Preferisci prima leggere qualcosa?
				<a href={APP_SAMPLE_WORLD_URL} rel="external" class="text-accent hover:underline">
					Valdoria Reach è un mondo nostro, pubblicato per i suoi giocatori &rarr;
				</a>
			</p>
		</div>
		<a
			href={APP_SIGN_UP_URL}
			rel="external"
			class="shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-medium text-panel hover:brightness-110"
		>
			Crea il tuo account
		</a>
	</section>

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

		<NewsletterForm {form} />
	</section>
</main>

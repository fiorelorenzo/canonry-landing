<script lang="ts">
	/**
	 * Issue #129: the Italian pricing page, on its own path (`/it/pricing`), a mirror of
	 * `../../pricing/+page.svelte` - same six sections, same shape from SPEC.md §15 -
	 * with every sentence written in Italian rather than translated word for word. The
	 * shape is decided (reading free, generation charged, a fixed published ceiling, a
	 * warm budget with its own line, BYO key never the default, one price table); the
	 * actual number is not, so it stays out of this page exactly as it stays out of the
	 * English one.
	 */
	import { OG_LOCALE } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const title = 'Prezzi: Canonry';
	const description = 'Cosa costa in crediti, cosa no, e perché qui non trovi ancora un numero.';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />

	<!-- Issue #129: `/it/pricing` is this page's Italian path, `/pricing` its English
	     counterpart on the same page - not the home page, see +layout.svelte's own doc
	     comment on why the language switch has to preserve the page it is on.
	     `x-default` matches the home page's own choice of English. -->
	<link rel="alternate" hreflang="it" href={`${data.origin}/it/pricing`} />
	<link rel="alternate" hreflang="en" href={`${data.origin}/pricing`} />
	<link rel="alternate" hreflang="x-default" href={`${data.origin}/pricing`} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Canonry" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={`${data.origin}/it/pricing`} />
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

<main id="main" class="mx-auto max-w-2xl px-6 pt-6 pb-16">
	<h1 class="text-2xl font-semibold text-ink">Prezzi</h1>
	<p class="mt-2 max-w-measure text-sm text-ink-2">
		La struttura è decisa (SPEC.md &sect;15). Il numero vero no, quindi qui sotto non trovi un
		segnaposto inventato.
	</p>

	<div class="mt-8 flex flex-col gap-6">
		<section class="rounded-lg border border-line bg-panel p-4">
			<h2 class="text-base font-semibold text-ink">Leggere è gratis</h2>
			<p class="mt-1.5 max-w-measure text-sm text-ink-2">
				Embedding, ricerca semantica, i suggerimenti di menzione e il recupero dietro le risposte di
				Ask non intaccano mai la tua quota. Vale anche a generazione spenta: cercare nel proprio
				canone non deve mai sembrare costoso, perché è proprio questo a rendere Canonry un wiki e
				non una cartella di file.
			</p>
		</section>

		<section class="rounded-lg border border-line bg-panel p-4">
			<h2 class="text-base font-semibold text-ink">Generare si paga</h2>
			<p class="mt-1.5 max-w-measure text-sm text-ink-2">
				Una voce redatta, un diff di propagazione, una risposta di Ask, un'immagine, un livello
				ambientale, l'estrazione di un'importazione: ognuna di queste operazioni costa crediti. Una
				chiamata a costo zero viene comunque registrata per intero, con i suoi token e il suo costo
				per noi - gratis per te non vuol dire gratis da far girare.
			</p>
		</section>

		<section class="rounded-lg border border-line bg-panel p-4">
			<h2 class="text-base font-semibold text-ink">Un tetto fisso, mai &laquo;illimitato&raquo;</h2>
			<p class="mt-1.5 max-w-measure text-sm text-ink-2">
				Generare si paga, leggere è gratis, e il piano incluso ha un tetto mensile di crediti fisso
				- un numero vero e pubblicato, non un limite morbido che ti rallenta senza dirtelo. Quel
				numero non è ancora deciso, quindi qui non viene indovinato: lo pubblicheremo prima di
				chiederti di pagare, in cifre chiare, non dietro un &laquo;contattaci&raquo;.
			</p>
		</section>

		<section class="rounded-lg border border-line bg-panel p-4">
			<h2 class="text-base font-semibold text-ink">Il precalcolo ha un budget a parte</h2>
			<p class="mt-1.5 max-w-measure text-sm text-ink-2">
				Il materiale precalcolato per la modalità tavolo - sintesi, bozze, ritratti preparati prima
				di una sessione - consuma crediti mentre nessuno guarda, quindi attinge da una voce separata
				e visibile, invece di nascondersi dentro la quota principale.
			</p>
		</section>

		<section class="rounded-lg border border-line bg-panel p-4">
			<h2 class="text-base font-semibold text-ink">Porta la tua chiave</h2>
			<p class="mt-1.5 max-w-measure text-sm text-ink-2">
				Usa la chiave del tuo provider di modelli al posto della quota inclusa. Disponibile per chi
				la vuole, mai come impostazione predefinita.
			</p>
		</section>

		<section class="rounded-lg border border-line bg-panel p-4">
			<h2 class="text-base font-semibold text-ink">Nessun credito opaco</h2>
			<p class="mt-1.5 max-w-measure text-sm text-ink-2">
				Il prezzo di ogni operazione a pagamento vive in un'unica tabella, modificabile da un
				amministratore, in vigore senza bisogno di un nuovo deploy. Un prezzo pari a zero è un modo
				legittimo per rendere gratuita un'operazione; un'operazione a cui nessuno ha ancora
				assegnato un prezzo fallisce in modo rumoroso, invece di addebitare zero in silenzio.
			</p>
		</section>
	</div>
</main>

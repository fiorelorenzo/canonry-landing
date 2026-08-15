<script lang="ts">
	/**
	 * Issue #129: the Italian export page, on its own path (`/it/docs/export`), a
	 * mirror of `../../../docs/export/+page.svelte`. This is the lock-in answer
	 * (docs/ux/DECISIONS.md, G10) linked from one line under the Italian home page's
	 * demo - the single most persuasive page on the site for a reader who has been
	 * burned by a tool that would not let its own data out.
	 */
	import { resolve } from '$app/paths';
	import { OG_LOCALE } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const title = 'Esportare il tuo mondo: Canonry';
	const description =
		"Cosa contiene l'esportazione in markdown, cosa lascia fuori, e cosa continua a funzionare a generazione spenta.";
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />

	<!-- Issue #129: `/it/docs/export` is this page's Italian path, `/docs/export` its
	     English counterpart on the same page - see +layout.svelte's own doc comment on
	     why the language switch has to preserve the page it is on rather than dropping a
	     reader on the home page. `x-default` matches the home page's own choice of
	     English. -->
	<link rel="alternate" hreflang="it" href={`${data.origin}/it/docs/export`} />
	<link rel="alternate" hreflang="en" href={`${data.origin}/docs/export`} />
	<link rel="alternate" hreflang="x-default" href={`${data.origin}/docs/export`} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Canonry" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={`${data.origin}/it/docs/export`} />
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
	<p class="text-sm text-ink-2">
		<a href={resolve('/it')} class="text-accent hover:underline">&larr; Indietro</a>
	</p>
	<h1 class="mt-2 text-2xl font-semibold text-ink">Esportare il tuo mondo</h1>

	<p class="mt-4 max-w-measure text-sm leading-relaxed text-ink-2">
		Ogni universo si può esportare come zip, in qualsiasi momento, da Impostazioni &rarr; Dati: un
		file markdown per voce, un frontmatter con l'id e il tipo della voce, i wikilink tra le voci,
		una cartella di immagini. È piatto, non organizzato in cartelle per tipo, e contiene solo quello
		che hai accettato - niente di ancora fermo nella tua casella di proposte finisce nel file.
	</p>

	<pre
		class="mt-4 overflow-x-auto rounded-lg border border-line bg-panel-2 p-3 font-mono text-xs text-ink-2">valdoria-reach-export.zip
├── aldric-vane.md
├── the-gilded-rat.md
└── images/</pre>

	<h2 class="mt-8 text-lg font-semibold text-ink">Niente lock-in</h2>
	<p class="mt-2 max-w-measure text-sm leading-relaxed text-ink-2">
		Markdown puro con wikilink si legge direttamente in Obsidian o in qualunque altro strumento che
		capisca la stessa sintassi <code>[[wikilink]]</code>, e come testo semplice ovunque altro - in
		ogni caso è un file sul tuo disco, non un formato che solo il codice di Canonry sa aprire.
	</p>

	<h2 class="mt-8 text-lg font-semibold text-ink">Se disattivi la generazione</h2>
	<p class="mt-2 max-w-measure text-sm leading-relaxed text-ink-2">
		Disattivare la generazione, per un singolo universo o per tutti quanti, non tocca questa
		esportazione e non tocca il canone che c'è sotto. Ricerca, navigazione, voci, relazioni e questo
		stesso zip continuano tutti a funzionare - si ferma solo la scrittura: bozze, propagazione,
		immagini e tutto il resto che scrive un modello.
	</p>

	<p class="mt-8 text-xs text-muted">
		Questa pagina descrive l'esportazione così come è stata decisa (docs/ux/DECISIONS.md, F4): uno
		zip piatto, senza cartelle per tipo, senza strumenti da repository integrati. Se mai cambierà,
		questa pagina cambia con lei.
	</p>
</main>

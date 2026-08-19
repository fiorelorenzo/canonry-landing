<script lang="ts">
	/**
	 * Issue #11: la versione italiana della pagina privacy - stessa struttura di
	 * `../../privacy/+page.svelte`, stesse verifiche contro `migrations/0001` e
	 * `0002` e `$lib/server/waitlist.ts`, ogni frase scritta in italiano invece che
	 * tradotta parola per parola (AGENTS.md: "the Italian is written as Italian
	 * rather than translated word for word").
	 */
	import { resolve } from '$app/paths';
	import { OG_LOCALE } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const title = 'Privacy: Canonry';
	const description =
		"Cosa conserviamo quando ti iscrivi alla lista d'attesa, chi lo vede, e come farti cancellare.";
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />

	<!-- Schema di issue #129: `/it/privacy` è il percorso italiano di questa pagina,
	     `/privacy` la controparte inglese. `x-default` segue la stessa scelta
	     dell'inglese fatta dalla home. -->
	<link rel="alternate" hreflang="it" href={`${data.origin}/it/privacy`} />
	<link rel="alternate" hreflang="en" href={`${data.origin}/privacy`} />
	<link rel="alternate" hreflang="x-default" href={`${data.origin}/privacy`} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Canonry" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={`${data.origin}/it/privacy`} />
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
	<h1 class="mt-2 text-2xl font-semibold text-ink">Privacy</h1>

	<p class="mt-4 max-w-measure text-sm leading-relaxed text-ink-2">
		Questa pagina raccoglie una cosa sola: l'indirizzo email che dai alla lista d'attesa. Ecco
		esattamente cosa gli succede.
	</p>

	<h2 class="mt-8 text-lg font-semibold text-ink">Cosa conserviamo</h2>
	<p class="mt-2 max-w-measure text-sm leading-relaxed text-ink-2">
		Il tuo indirizzo, più quattro cose sul momento in cui l'hai dato, nella stessa riga del
		database:
	</p>
	<ul class="mt-2 max-w-measure list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-2">
		<li>la frase esatta che hai visto accanto al pulsante, nella lingua in cui l'hai vista</li>
		<li>quale delle due lingue fosse</li>
		<li>
			a cosa hai aderito - oggi solo essere avvisato quando Canonry sarà pronto, perché questo
			modulo non offre ancora una seconda opzione
		</li>
		<li>il momento in cui hai cliccato il link di conferma, vuoto finché non lo fai</li>
	</ul>

	<h2 class="mt-8 text-lg font-semibold text-ink">Chi lo vede</h2>
	<p class="mt-2 max-w-measure text-sm leading-relaxed text-ink-2">
		La tua iscrizione e il link di conferma passano entrambi da Resend, sul nostro dominio
		<code>canonry.io</code> verificato, con una chiave dedicata solo a questo sito, non al prodotto. Resend
		è l'unico terzo che vede il tuo indirizzo.
	</p>

	<h2 class="mt-8 text-lg font-semibold text-ink">A cosa serve</h2>
	<p class="mt-2 max-w-measure text-sm leading-relaxed text-ink-2">
		Una sola email: avvisarti quando Canonry sarà pronto. È la promessa accanto al pulsante, ed è
		quello che registriamo come ambito del consenso - niente di più ampio succede al tuo indirizzo
		finché una futura versione di questo modulo non aggiunge davvero una seconda opzione, che oggi
		non esiste.
	</p>

	<h2 class="mt-8 text-lg font-semibold text-ink">Come farti cancellare</h2>
	<p class="mt-2 max-w-measure text-sm leading-relaxed text-ink-2">
		Scrivi a <a href="mailto:privacy@canonry.io" class="text-accent hover:underline"
			>privacy@canonry.io</a
		> con l'indirizzo con cui ti sei iscritto e cancelliamo la riga. Non c'è ancora un link di cancellazione
		automatica su questo sito - una richiesta via email è tutto il processo, e rimuove indirizzo, consenso
		e stato di conferma insieme, perché sono la stessa riga.
	</p>

	<p class="mt-8 max-w-measure text-sm leading-relaxed text-ink-2">
		È tutto quello che questa pagina raccoglie. Per come il prodotto stesso, account, contenuto
		delle campagne, i provider AI dietro di esso, gestisce i dati, vedi la pagina privacy più ampia
		di Canonry:
		<a href="https://app.canonry.io/privacy" class="text-accent hover:underline"
			>app.canonry.io/privacy</a
		>. Copre una cosa diversa: cosa succede dopo che hai un account, non cosa succede quando scrivi
		un'email qui.
	</p>

	<p class="mt-8 text-xs text-muted">
		Questa pagina descrive la lista d'attesa esattamente come la definiscono oggi
		`migrations/0001_waitlist_signup.sql`, `migrations/0002_waitlist_consent.sql` e
		`$lib/server/waitlist.ts`. Se cambia, cambia anche questa pagina.
	</p>
</main>

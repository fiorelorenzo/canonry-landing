<script lang="ts">
	/**
	 * Not a `/` or `/it` page: this link is only ever reached from a confirmation email,
	 * never crawled or linked from the site, so it renders in whichever locale the row's
	 * own `consent_locale` names (`data.locale`, from `$lib/server/confirm.ts`) rather
	 * than the URL path `$lib/i18n`'s two locales otherwise decide language from. A
	 * failed lookup (bad or already-superseded token) has no locale to read, so it falls
	 * back to English.
	 */
	import type { Locale } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const COPY: Record<
		Locale,
		{ title: string; body: string; failedTitle: string; failedBody: string }
	> = {
		en: {
			title: "You're confirmed",
			body: "Thanks - we'll email you occasionally about new Canonry features.",
			failedTitle: 'That link did not work',
			failedBody:
				'This confirmation link is not valid. It may already have been used, or the address it was sent to may have been re-submitted since.'
		},
		it: {
			title: 'Confermato',
			body: 'Grazie: ti scriveremo ogni tanto per le novità di Canonry.',
			failedTitle: 'Il link non ha funzionato',
			failedBody:
				"Questo link di conferma non è valido. Potrebbe essere già stato usato, oppure l'indirizzo a cui è stato inviato potrebbe essere stato inviato di nuovo da allora."
		}
	};

	let t = $derived(COPY[data.ok ? data.locale : 'en']);
</script>

<svelte:head>
	<title>Canonry</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main" class="mx-auto max-w-sm px-6 pt-16 pb-16 text-center">
	<h1 class="text-lg font-medium text-ink">{data.ok ? t.title : t.failedTitle}</h1>
	<p class="mt-2 text-sm {data.ok ? 'text-ink-2' : 'text-danger'}">
		{data.ok ? t.body : t.failedBody}
	</p>
</main>

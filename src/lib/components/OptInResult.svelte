<script lang="ts">
	/**
	 * What a reader sees after following the newsletter link in the launch notification
	 * (issue #14). Shared by `/newsletter/[token]` and `/it/newsletter/[token]` rather than
	 * written twice: the two routes exist so that Italian keeps its own path (`$lib/i18n`),
	 * and the path is also what tells the opt-in which language's consent sentence was read,
	 * but the page itself is the same page in two languages.
	 *
	 * Reached only from that email, never linked from the site, so it is `noindex` and has no
	 * navigation: the same treatment `/confirm/[token]` gets.
	 */
	import type { Locale } from '$lib/i18n';

	let { ok, locale }: { ok: boolean; locale: Locale } = $props();

	const COPY: Record<
		Locale,
		{ title: string; body: string; failedTitle: string; failedBody: string }
	> = {
		en: {
			title: "You're on the newsletter",
			body: "Thanks. We'll email you occasionally about new Canonry features, and nothing else.",
			failedTitle: 'That link did not work',
			failedBody:
				'This link is not valid. It may belong to an address that has been removed since the email went out.'
		},
		it: {
			title: 'Sei iscritto alla newsletter',
			body: 'Grazie: ti scriveremo ogni tanto per le novità di Canonry, e per nient\u2019altro.',
			failedTitle: 'Il link non ha funzionato',
			failedBody:
				"Questo link non è valido. Potrebbe appartenere a un indirizzo cancellato dopo l'invio dell'email."
		}
	};

	let t = $derived(COPY[locale]);
</script>

<svelte:head>
	<title>Canonry</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main" class="mx-auto max-w-sm px-6 pt-16 pb-16 text-center">
	<h1 class="text-lg font-medium text-ink">{ok ? t.title : t.failedTitle}</h1>
	<p class="mt-2 text-sm {ok ? 'text-ink-2' : 'text-danger'}">
		{ok ? t.body : t.failedBody}
	</p>
</main>

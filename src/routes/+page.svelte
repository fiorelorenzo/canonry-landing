<script lang="ts">
	import { resolve } from '$app/paths';
	import PropagationDemo from '$lib/components/PropagationDemo.svelte';
	import { APP_SAMPLE_WORLD_URL, APP_SIGN_UP_URL } from '$lib/app';
	import NewsletterForm from '$lib/components/NewsletterForm.svelte';
	import { OG_LOCALE } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();

	const title = 'Canonry: a wiki with a copilot that never writes without you';
	const description =
		'Change one entry and Canonry tells you which other entries that touches, drafts each update, and waits for you to accept or throw it away, one by one.';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />

	<!-- Issue #129: `/` is the English original, `/it` its Italian counterpart - both
	     directions declared so a crawler indexes each path in its own language instead of
	     picking one arbitrarily, and `x-default` points back at this page since English is
	     what a visitor gets when nothing else disambiguates. -->
	<link rel="alternate" hreflang="en" href={data.origin} />
	<link rel="alternate" hreflang="it" href={`${data.origin}/it`} />
	<link rel="alternate" hreflang="x-default" href={data.origin} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Canonry" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={data.origin} />
	<meta property="og:image" content={`${data.origin}/og.png`} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:locale" content={OG_LOCALE.en} />
	<meta property="og:locale:alternate" content={OG_LOCALE.it} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={`${data.origin}/og.png`} />
</svelte:head>

<main id="main" class="mx-auto max-w-3xl px-6 pt-6 pb-16">
	<!-- F6 = C: the demo is the hero, no copy above it. This is the one line the decision
	     keeps ("Keep the one-line descriptor exactly as drawn") - everything else a
	     visitor reads is either the real demo below or the below-the-fold strip after it. -->
	<p class="mb-3 text-sm text-muted">
		Canonry: a wiki with an AI copilot that never writes without you.
	</p>

	<PropagationDemo />

	<!-- G10 = A: the lock-in answer, one sentence below the demo, linking to the docs page
	     that states it fully. -->
	<p class="mt-3 border-t border-line pt-3 text-sm text-ink-2">
		Export your whole world as markdown, any time, from Settings.
		<a href={resolve('/docs/export')} class="text-accent hover:underline">
			What's in the file, and what happens if you turn the AI off &rarr;
		</a>
	</p>

	<!-- M1 (docs/ux/DECISIONS.md, round eight): the door. app.canonry.io is the whole
	     product now, healthy, on a tagged release - password recovery and account
	     deletion both shipped in v0.8.0, which is what this call to action was waiting
	     on. -->
	<section
		class="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-panel p-4"
	>
		<div>
			<p class="text-sm font-medium text-ink">app.canonry.io is live.</p>
			<p class="mt-1 text-sm text-ink-2">Create a free account and start your own world.</p>
			<!-- Issue #15: M1's other half. The world behind this link is ours, and the copy
			     says so rather than letting a reader assume they are reading a customer's
			     campaign. It reads without an account because its GM published a slice of it,
			     which is the product's own players' wiki and not a demo of one. -->
			<p class="mt-2 text-sm text-ink-2">
				Rather read something first?
				<a href={APP_SAMPLE_WORLD_URL} rel="external" class="text-accent hover:underline">
					Valdoria Reach is a world of ours, published for its players &rarr;
				</a>
			</p>
		</div>
		<a
			href={APP_SIGN_UP_URL}
			rel="external"
			class="shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-medium text-panel hover:brightness-110"
		>
			Create your account
		</a>
	</section>

	<section class="mt-12 grid gap-10 sm:grid-cols-2">
		<div class="max-w-measure text-sm leading-relaxed text-ink-2">
			<p>
				About a third of GMs already lean on a general chatbot to help run a game. Canonry is that
				habit with a memory of your world: it drafts, it flags what looks off, and it always waits
				for a yes before anything joins your canon.
			</p>
			<p class="mt-3">
				Prefer no AI at all, or just want it off for one universe? Generation switches off
				completely and what is left is still a good wiki: search, entries, relations and the export
				above all keep working. Only the drafting stops.
			</p>
		</div>

		<NewsletterForm {form} />
	</section>
</main>

<script lang="ts">
	import { resolve } from '$app/paths';
	import PropagationDemo from '$lib/components/PropagationDemo.svelte';
	import WaitlistForm from '$lib/components/WaitlistForm.svelte';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();

	const title = 'Canonry: a wiki with a copilot that never writes without you';
	const description =
		'Change one entry and Canonry tells you which other entries that touches, drafts each update, and waits for you to accept or throw it away, one by one.';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Canonry" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={data.origin} />
	<meta property="og:image" content={`${data.origin}/og.png`} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

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

		<WaitlistForm {form} />
	</section>
</main>

<script lang="ts">
	import { resolve } from '$app/paths';
	import { OG_LOCALE } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const title = 'Exporting your world: Canonry';
	const description =
		'What the markdown export contains, what it leaves out, and what still works with generation switched off.';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />

	<!-- Issue #129: `/docs/export` is this page's English path, `/it/docs/export` its
	     Italian counterpart on the same page - not the home page, see +layout.svelte's
	     own doc comment on why the language switch has to preserve the page it is on.
	     `x-default` matches the home page's own choice of English. -->
	<link rel="alternate" hreflang="en" href={`${data.origin}/docs/export`} />
	<link rel="alternate" hreflang="it" href={`${data.origin}/it/docs/export`} />
	<link rel="alternate" hreflang="x-default" href={`${data.origin}/docs/export`} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Canonry" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={`${data.origin}/docs/export`} />
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

<main id="main" class="mx-auto max-w-2xl px-6 pt-6 pb-16">
	<p class="text-sm text-ink-2">
		<a href={resolve('/')} class="text-accent hover:underline">&larr; Back</a>
	</p>
	<h1 class="mt-2 text-2xl font-semibold text-ink">Exporting your world</h1>

	<p class="mt-4 max-w-measure text-sm leading-relaxed text-ink-2">
		Every universe can be exported as a zip, any time, from Settings &rarr; Data: one markdown file
		per entry, frontmatter carrying the entry's id and type, wikilinks between entries, an images
		folder. It is flat, not organised into folders by type, and it holds only what you have accepted
		- nothing still sitting in your proposal inbox ends up in the file.
	</p>

	<pre
		class="mt-4 overflow-x-auto rounded-lg border border-line bg-panel-2 p-3 font-mono text-xs text-ink-2">valdoria-reach-export.zip
├── aldric-vane.md
├── the-gilded-rat.md
└── images/</pre>

	<h2 class="mt-8 text-lg font-semibold text-ink">No lock-in</h2>
	<p class="mt-2 max-w-measure text-sm leading-relaxed text-ink-2">
		Plain markdown with wikilinks reads directly in Obsidian or anything else that understands the
		same <code>[[wikilink]]</code> syntax, and as plain text everywhere else - it is a file on your disk
		either way, not a format only Canonry's own code can open.
	</p>

	<h2 class="mt-8 text-lg font-semibold text-ink">If you turn generation off</h2>
	<p class="mt-2 max-w-measure text-sm leading-relaxed text-ink-2">
		Switching generation off, for one universe or for all of them, does not touch this export and
		does not touch the canon underneath it. Search, browsing, entries, relations and this same zip
		all keep working - only drafting, propagation, images and everything else a model writes stops.
	</p>

	<p class="mt-8 text-xs text-muted">
		This describes the export as decided (docs/ux/DECISIONS.md, F4): a flat zip, no typed folders,
		no repository tooling built in. If that ever changes, this page changes with it.
	</p>
</main>

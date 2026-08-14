<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>Exporting your world — Canonry</title>
	<meta
		name="description"
		content="What the markdown export contains, what it leaves out, and what still works with generation switched off."
	/>
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

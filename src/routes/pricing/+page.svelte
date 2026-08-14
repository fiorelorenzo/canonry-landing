<svelte:head>
	<title>Pricing: Canonry</title>
	<meta
		name="description"
		content="What costs credits, what does not, and why there is no number here yet."
	/>
</svelte:head>

<main id="main" class="mx-auto max-w-2xl px-6 pt-6 pb-16">
	<h1 class="text-2xl font-semibold text-ink">Pricing</h1>
	<p class="mt-2 max-w-measure text-sm text-ink-2">
		The shape of it is decided (SPEC.md &sect;15). The actual number is not, so it is not printed
		below as a placeholder.
	</p>

	<div class="mt-8 flex flex-col gap-6">
		<section class="rounded-lg border border-line bg-panel p-4">
			<h2 class="text-base font-semibold text-ink">Reading is free</h2>
			<p class="mt-1.5 max-w-measure text-sm text-ink-2">
				Embeddings, semantic search, mention suggestions and the retrieval behind an Ask never draw
				on your quota. That holds even with generation switched off: searching your own canon should
				never feel expensive, because that is most of what makes this a wiki rather than a folder.
			</p>
		</section>

		<section class="rounded-lg border border-line bg-panel p-4">
			<h2 class="text-base font-semibold text-ink">Generation is charged</h2>
			<p class="mt-1.5 max-w-measure text-sm text-ink-2">
				A drafted entry, a propagation diff, an Ask answer, an image, an ambient layer and an
				import's extraction each cost credits. A zero-credit call is still recorded in full with its
				tokens and its cost to us; free to you is not free to run.
			</p>
		</section>

		<section class="rounded-lg border border-line bg-panel p-4">
			<h2 class="text-base font-semibold text-ink">
				A fixed ceiling, never &ldquo;unlimited&rdquo;
			</h2>
			<p class="mt-1.5 max-w-measure text-sm text-ink-2">
				Generation is charged, reading is free, and the included plan has a fixed monthly credit
				ceiling - a real, published number, not a soft limit that quietly throttles you. That number
				is not decided yet, so it is not guessed at here: we will publish it before we ask you to
				pay, in plain digits, not behind &ldquo;contact us&rdquo;.
			</p>
		</section>

		<section class="rounded-lg border border-line bg-panel p-4">
			<h2 class="text-base font-semibold text-ink">Warming has its own budget</h2>
			<p class="mt-1.5 max-w-measure text-sm text-ink-2">
				Pre-computed material for table mode - briefs, drafts, portraits warmed ahead of a session -
				spends credits while nobody is watching, so it draws from a separate, visible line rather
				than hiding inside the main quota.
			</p>
		</section>

		<section class="rounded-lg border border-line bg-panel p-4">
			<h2 class="text-base font-semibold text-ink">Bring your own key</h2>
			<p class="mt-1.5 max-w-measure text-sm text-ink-2">
				Use your own model provider key instead of the included quota. Available for anyone who
				wants it, never the default.
			</p>
		</section>

		<section class="rounded-lg border border-line bg-panel p-4">
			<h2 class="text-base font-semibold text-ink">No opaque credits</h2>
			<p class="mt-1.5 max-w-measure text-sm text-ink-2">
				Every chargeable operation's price lives in one table, editable by an admin, in effect
				without a deploy. A price of zero is a legitimate way for an operation to be free; an
				operation nobody has priced fails loudly instead of silently charging nothing.
			</p>
		</section>
	</div>
</main>

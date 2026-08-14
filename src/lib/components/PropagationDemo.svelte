<script lang="ts">
	/**
	 * "The demo as the hero, no copy above it": the whole product pitch is one real,
	 * clickable sequence over the sample world (the canonry product repository's
	 * docs/ux/SAMPLE-WORLD.md, via $lib/sample-world.ts), not a description of one.
	 * Three tabs, freely reorderable, but the diff step's Accept/Reject buttons are
	 * the only thing that ever changes `outcome` - there is no path through this
	 * component that reaches a settled state without that explicit click, which is
	 * guardrail 1 ("propose, never apply") read literally on the one page every
	 * visitor sees before guardrail 1 is ever explained to them. Nothing here calls
	 * an API, a model or a database: it is three objects from sample-world.ts and two
	 * booleans, which is also what makes this page work as a static asset.
	 */
	import { DIFF, EDIT, PLAN } from '$lib/sample-world';

	type Tab = 'edit' | 'plan' | 'diff';
	type Outcome = 'pending' | 'accepted' | 'rejected';

	let activeTab = $state<Tab>('edit');
	let outcome = $state<Outcome>('pending');

	const tabs: { id: Tab; label: string }[] = [
		{ id: 'edit', label: '1. Edit' },
		{ id: 'plan', label: '2. Plan' },
		{ id: 'diff', label: '3. Diff & accept' }
	];

	function statusText(o: Outcome): string {
		if (o === 'accepted') return `Accepted, added to ${DIFF.entity}'s revision history`;
		if (o === 'rejected') return 'Rejected, one-word reason recorded';
		return 'Awaiting your review';
	}
</script>

<div class="overflow-hidden rounded-xl border border-line-2 bg-panel-2">
	<div role="tablist" aria-label="Propagation demo steps" class="flex flex-wrap gap-2 p-4 pb-0">
		{#each tabs as tab (tab.id)}
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === tab.id}
				class={[
					'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
					activeTab === tab.id
						? 'bg-accent text-panel'
						: 'border border-line-2 text-ink-2 hover:bg-panel'
				]}
				onclick={() => (activeTab = tab.id)}
			>
				{tab.label}
			</button>
		{/each}
	</div>

	<div class="p-4">
		{#if activeTab === 'edit'}
			<div class="rounded-lg border border-line bg-panel p-4" data-demo-step="edit">
				<header class="mb-2 flex items-center justify-between gap-3">
					<h3 class="text-base font-semibold text-ink">{EDIT.entity}</h3>
					<span
						class="rounded-full bg-panel-2 px-1.5 py-0.5 font-mono text-xs text-muted uppercase"
					>
						{EDIT.entityType}
					</span>
				</header>
				<p class="max-w-measure text-sm text-ink-2">
					<span class="rounded-sm bg-ai-bg px-1 py-0.5 text-ink">{EDIT.after}</span>
				</p>
				<p class="mt-3 text-xs text-muted">
					Saved. Open &ldquo;2. Plan&rdquo; to see what it touches.
				</p>
			</div>
		{:else if activeTab === 'plan'}
			<div class="rounded-lg border border-line bg-panel p-4" data-demo-step="plan">
				<h3 class="mb-3 text-base font-semibold text-ink">
					This change touches {PLAN.length} entries
				</h3>
				<ul class="flex flex-col gap-2">
					{#each PLAN as row (row.entity)}
						<li class="flex flex-wrap items-baseline gap-2 text-sm">
							<span class="font-medium text-ink">{row.entity}</span>
							<span class="text-ink-2">{row.why}</span>
						</li>
					{/each}
				</ul>
				<p class="mt-3 text-xs text-muted">
					Cap ~10 entries per plan. Open &ldquo;3. Diff &amp; accept&rdquo; to review one.
				</p>
			</div>
		{:else}
			<div class="rounded-lg border border-line bg-panel p-4" data-demo-step="diff">
				<header class="mb-2 flex items-start justify-between gap-3">
					<h3 class="text-base font-semibold text-ink">{DIFF.entity}</h3>
					<span
						class="rounded-full bg-panel-2 px-1.5 py-0.5 font-mono text-xs text-muted uppercase"
					>
						entry {DIFF.position} of {DIFF.total}
					</span>
				</header>
				<p class="mb-3 text-xs text-muted">Evidence: {DIFF.evidence}</p>
				<div class="mb-3 max-w-measure text-sm leading-relaxed">
					<p class="mb-1.5 text-muted line-through decoration-line-2">{DIFF.removed}</p>
					<p class="rounded-sm bg-ai-bg px-1 py-0.5 text-ink">{DIFF.added}</p>
				</div>

				{#if outcome === 'pending'}
					<div class="flex flex-wrap items-center gap-2">
						<button
							type="button"
							class="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-panel hover:brightness-110"
							onclick={() => (outcome = 'accepted')}
						>
							Accept
						</button>
						<button
							type="button"
							class="rounded-md border border-line-2 px-3 py-1.5 text-sm text-ink-2 hover:bg-panel-2"
							onclick={() => (outcome = 'rejected')}
						>
							Reject
						</button>
						<span class="text-xs text-muted" data-demo-status>{statusText(outcome)}</span>
					</div>
				{:else}
					<span
						class={[
							'inline-block rounded-full px-2 py-0.5 font-mono text-xs',
							outcome === 'accepted' ? 'bg-ok-bg text-ok' : 'bg-danger-bg text-danger'
						]}
						data-demo-status
					>
						{statusText(outcome)}
					</span>
				{/if}
			</div>
		{/if}
	</div>
</div>

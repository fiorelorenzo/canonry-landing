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
	 *
	 * Issue #129: the demo's copy - tab labels, headings, statuses, and the sample
	 * world's own prose - is part of the translation, "the first thing a visitor
	 * reads". `locale` comes from the URL path (`$lib/i18n`), the same source every
	 * other piece of chrome on this site reads from, so the demo never needs a prop.
	 */
	import { page } from '$app/state';
	import { localeFromPathname, type Locale } from '$lib/i18n';
	import { SAMPLE_WORLD } from '$lib/sample-world';

	type Tab = 'edit' | 'plan' | 'diff';
	type Outcome = 'pending' | 'accepted' | 'rejected';

	let activeTab = $state<Tab>('edit');
	let outcome = $state<Outcome>('pending');

	let locale = $derived(localeFromPathname(page.url.pathname));
	let world = $derived(SAMPLE_WORLD[locale]);

	interface DemoCopy {
		ariaLabel: string;
		tabs: Record<Tab, string>;
		savedNoticeBefore: string;
		savedNoticeAfter: string;
		planHeading: (count: number) => string;
		planFooterBefore: string;
		planFooterAfter: string;
		diffBadge: (position: number, total: number) => string;
		evidenceLabel: string;
		accept: string;
		reject: string;
		statusAccepted: (entity: string) => string;
		statusRejected: string;
		statusPending: string;
	}

	const COPY: Record<Locale, DemoCopy> = {
		en: {
			ariaLabel: 'Propagation demo steps',
			tabs: { edit: '1. Edit', plan: '2. Plan', diff: '3. Diff & accept' },
			savedNoticeBefore: 'Saved. Open \u201c',
			savedNoticeAfter: '\u201d to see what it touches.',
			planHeading: (count) => `This change touches ${count} entries`,
			planFooterBefore: 'Cap ~10 entries per plan. Open \u201c',
			planFooterAfter: '\u201d to review one.',
			diffBadge: (position, total) => `entry ${position} of ${total}`,
			evidenceLabel: 'Evidence:',
			accept: 'Accept',
			reject: 'Reject',
			statusAccepted: (entity) => `Accepted, added to ${entity}'s revision history`,
			statusRejected: 'Rejected, one-word reason recorded',
			statusPending: 'Awaiting your review'
		},
		it: {
			ariaLabel: 'Passaggi della demo di propagazione',
			tabs: { edit: '1. Modifica', plan: '2. Piano', diff: '3. Differenze e conferma' },
			savedNoticeBefore: 'Salvato. Apri \u00ab',
			savedNoticeAfter: '\u00bb per vedere cosa tocca.',
			planHeading: (count) => `Questa modifica tocca ${count} voci`,
			planFooterBefore: 'Limite di circa 10 voci per piano. Apri \u00ab',
			planFooterAfter: '\u00bb per rivederne una.',
			diffBadge: (position, total) => `voce ${position} di ${total}`,
			evidenceLabel: 'Prova:',
			accept: 'Accetta',
			reject: 'Rifiuta',
			statusAccepted: (entity) => `Accettato, aggiunto allo storico delle revisioni di ${entity}`,
			statusRejected: 'Rifiutato, motivo di una parola registrato',
			statusPending: 'In attesa della tua revisione'
		}
	};
	let t = $derived(COPY[locale]);

	const tabs: Tab[] = ['edit', 'plan', 'diff'];

	function statusText(o: Outcome, copy: DemoCopy, entity: string): string {
		if (o === 'accepted') return copy.statusAccepted(entity);
		if (o === 'rejected') return copy.statusRejected;
		return copy.statusPending;
	}
</script>

<div class="overflow-hidden rounded-xl border border-line-2 bg-panel-2">
	<div role="tablist" aria-label={t.ariaLabel} class="flex flex-wrap gap-2 p-4 pb-0">
		{#each tabs as tabId (tabId)}
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === tabId}
				class={[
					'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
					activeTab === tabId
						? 'bg-accent text-panel'
						: 'border border-line-2 text-ink-2 hover:bg-panel'
				]}
				onclick={() => (activeTab = tabId)}
			>
				{t.tabs[tabId]}
			</button>
		{/each}
	</div>

	<div class="p-4">
		{#if activeTab === 'edit'}
			<div class="rounded-lg border border-line bg-panel p-4" data-demo-step="edit">
				<header class="mb-2 flex items-center justify-between gap-3">
					<h3 class="text-base font-semibold text-ink">{world.edit.entity}</h3>
					<span
						class="rounded-full bg-panel-2 px-1.5 py-0.5 font-mono text-xs text-muted uppercase"
					>
						{world.edit.entityType}
					</span>
				</header>
				<p class="max-w-measure text-sm text-ink-2">
					<span class="rounded-sm bg-ai-bg px-1 py-0.5 text-ink">{world.edit.after}</span>
				</p>
				<p class="mt-3 text-xs text-muted">
					{t.savedNoticeBefore}{t.tabs.plan}{t.savedNoticeAfter}
				</p>
			</div>
		{:else if activeTab === 'plan'}
			<div class="rounded-lg border border-line bg-panel p-4" data-demo-step="plan">
				<h3 class="mb-3 text-base font-semibold text-ink">
					{t.planHeading(world.plan.length)}
				</h3>
				<ul class="flex flex-col gap-2">
					{#each world.plan as row (row.entity)}
						<li class="flex flex-wrap items-baseline gap-2 text-sm">
							<span class="font-medium text-ink">{row.entity}</span>
							<span class="text-ink-2">{row.why}</span>
						</li>
					{/each}
				</ul>
				<p class="mt-3 text-xs text-muted">
					{t.planFooterBefore}{t.tabs.diff}{t.planFooterAfter}
				</p>
			</div>
		{:else}
			<div class="rounded-lg border border-line bg-panel p-4" data-demo-step="diff">
				<header class="mb-2 flex items-start justify-between gap-3">
					<h3 class="text-base font-semibold text-ink">{world.diff.entity}</h3>
					<span
						class="rounded-full bg-panel-2 px-1.5 py-0.5 font-mono text-xs text-muted uppercase"
					>
						{t.diffBadge(world.diff.position, world.diff.total)}
					</span>
				</header>
				<p class="mb-3 text-xs text-muted">{t.evidenceLabel} {world.diff.evidence}</p>
				<div class="mb-3 max-w-measure text-sm leading-relaxed">
					<p class="mb-1.5 text-muted line-through decoration-line-2">{world.diff.removed}</p>
					<p class="rounded-sm bg-ai-bg px-1 py-0.5 text-ink">{world.diff.added}</p>
				</div>

				{#if outcome === 'pending'}
					<div class="flex flex-wrap items-center gap-2">
						<button
							type="button"
							class="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-panel hover:brightness-110"
							onclick={() => (outcome = 'accepted')}
						>
							{t.accept}
						</button>
						<button
							type="button"
							class="rounded-md border border-line-2 px-3 py-1.5 text-sm text-ink-2 hover:bg-panel-2"
							onclick={() => (outcome = 'rejected')}
						>
							{t.reject}
						</button>
						<span class="text-xs text-muted" data-demo-status
							>{statusText(outcome, t, world.diff.entity)}</span
						>
					</div>
				{:else}
					<span
						class={[
							'inline-block rounded-full px-2 py-0.5 font-mono text-xs',
							outcome === 'accepted' ? 'bg-ok-bg text-ok' : 'bg-danger-bg text-danger'
						]}
						data-demo-status
					>
						{statusText(outcome, t, world.diff.entity)}
					</span>
				{/if}
			</div>
		{/if}
	</div>
</div>

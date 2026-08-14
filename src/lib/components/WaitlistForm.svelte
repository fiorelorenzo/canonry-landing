<script lang="ts">
	/**
	 * Progressively enhanced but works with `use:enhance` stripped out too - a plain
	 * POST to `?/subscribe` (this app's own tiny server route) is a full page form
	 * action, so a visitor with JavaScript off still gets a real submission and a
	 * real result. Duplicate email is success, not an error (see waitlist.ts):
	 * `form?.ok` is true either way, so this component never has to know or say
	 * "you're already on the list" as anything other than "you're on the list".
	 */
	import { enhance } from '$app/forms';

	let { form }: { form?: { ok?: boolean; error?: string } | null } = $props();
	let submitting = $state(false);
</script>

<form
	method="POST"
	action="?/subscribe"
	class="max-w-sm"
	use:enhance={() => {
		submitting = true;
		return async ({ update, result }) => {
			submitting = false;
			await update({ reset: result.type === 'success' });
		};
	}}
>
	<label for="waitlist-email" class="text-sm font-medium text-ink">
		Get notified when there is something to try
	</label>
	<p class="mt-1 text-xs text-ink-2">
		Your address goes on a list for exactly one email, when that is true. Never sold, never shared.
	</p>

	<div class="mt-2 flex flex-wrap gap-2">
		<input
			id="waitlist-email"
			name="email"
			type="email"
			required
			placeholder="you@example.com"
			class="min-w-0 flex-1 rounded-md border border-line-2 bg-panel px-3 py-1.5 text-sm text-ink placeholder:text-muted"
		/>
		<button
			type="submit"
			disabled={submitting}
			class="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-panel hover:brightness-110 disabled:opacity-60"
		>
			{submitting ? 'Joining\u2026' : 'Join the waiting list'}
		</button>
	</div>

	<div class="mt-2 min-h-5 text-sm" aria-live="polite">
		{#if form?.ok}
			<span class="text-ok">You're on the list.</span>
		{:else if form?.error}
			<span class="text-danger">{form.error}</span>
		{/if}
	</div>
</form>

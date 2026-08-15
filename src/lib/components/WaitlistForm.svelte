<script lang="ts">
	/**
	 * Progressively enhanced but works with `use:enhance` stripped out too - a plain
	 * POST to `?/subscribe` (this app's own tiny server route) is a full page form
	 * action, so a visitor with JavaScript off still gets a real submission and a
	 * real result. Duplicate email is success, not an error (see waitlist.ts):
	 * `form?.ok` is true either way, so this component never has to know or say
	 * "you're already on the list" as anything other than "you're on the list".
	 *
	 * Issue #129: `locale` (from `page.url.pathname` - `/` or `/it`, `$lib/i18n`) picks
	 * every string here, `form?.error`'s code included - the server action itself has
	 * no opinion on language (`$lib/server/waitlist.ts`'s own doc comment), only this
	 * component does.
	 */
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { localeFromPathname, type Locale } from '$lib/i18n';

	let { form }: { form?: { ok?: boolean; error?: string } | null } = $props();
	let submitting = $state(false);
	let locale = $derived(localeFromPathname(page.url.pathname));

	const COPY: Record<
		Locale,
		{
			label: string;
			hint: string;
			placeholder: string;
			join: string;
			joining: string;
			success: string;
			errors: Record<'invalid_email' | 'save_failed' | 'empty_email', string>;
		}
	> = {
		en: {
			label: 'Get notified when there is something to try',
			hint: 'Your address goes on a list for exactly one email, when that is true. Never sold, never shared.',
			placeholder: 'you@example.com',
			join: 'Join the waiting list',
			joining: 'Joining\u2026',
			success: "You're on the list.",
			errors: {
				invalid_email: 'That does not look like an email address.',
				save_failed: 'Could not save that just now. Try again in a moment.',
				empty_email: 'Enter an email address.'
			}
		},
		it: {
			label: 'Ricevi una notifica quando ci sarà qualcosa da provare',
			hint: 'Il tuo indirizzo finisce in una lista per una sola email, quando sarà il momento. Mai venduto, mai condiviso.',
			placeholder: 'tu@esempio.com',
			join: "Iscriviti alla lista d'attesa",
			joining: 'Iscrizione in corso\u2026',
			success: 'Sei in lista.',
			errors: {
				invalid_email: 'Non sembra un indirizzo email.',
				save_failed: 'Non siamo riusciti a salvarlo ora. Riprova tra poco.',
				empty_email: 'Inserisci un indirizzo email.'
			}
		}
	};
	let t = $derived(COPY[locale]);
	let errorText = $derived(
		form?.error && form.error in t.errors
			? t.errors[form.error as keyof typeof t.errors]
			: form?.error
	);
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
		{t.label}
	</label>
	<p class="mt-1 text-xs text-ink-2">
		{t.hint}
	</p>

	<div class="mt-2 flex flex-wrap gap-2">
		<input
			id="waitlist-email"
			name="email"
			type="email"
			required
			placeholder={t.placeholder}
			class="min-w-0 flex-1 rounded-md border border-line-2 bg-panel px-3 py-1.5 text-sm text-ink placeholder:text-muted"
		/>
		<button
			type="submit"
			disabled={submitting}
			class="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-panel hover:brightness-110 disabled:opacity-60"
		>
			{submitting ? t.joining : t.join}
		</button>
	</div>

	<div class="mt-2 min-h-5 text-sm" aria-live="polite">
		{#if form?.ok}
			<span class="text-ok">{t.success}</span>
		{:else if errorText}
			<span class="text-danger">{errorText}</span>
		{/if}
	</div>
</form>

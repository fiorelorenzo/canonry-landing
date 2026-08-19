<script lang="ts">
	/**
	 * M1 (docs/ux/DECISIONS.md, round eight): renamed from `WaitlistForm.svelte`. This
	 * is no longer a launch waiting list - the product is out, `app.canonry.io` is the
	 * primary door now - so this form is demoted to what it honestly is: an explicitly
	 * named newsletter opt-in for occasional email about new features.
	 *
	 * Progressively enhanced but works with `use:enhance` stripped out too - a plain
	 * POST to `?/subscribe` (this app's own tiny server route) is a full page form
	 * action, so a visitor with JavaScript off still gets a real submission and a
	 * real result. Duplicate email is success, not an error (see waitlist.ts):
	 * `form?.ok` is true either way, so this component never has to know or say
	 * "you're already subscribed" as anything other than "check your email" - which is
	 * also true for a still-pending resubmission (issue #8: the confirmation gets
	 * resent), not only for a first signup.
	 *
	 * Issue #129: `locale` (from `page.url.pathname` - `/` or `/it`, `$lib/i18n`) picks
	 * every string here, `form?.error`'s code included - the server action itself has
	 * no opinion on language (`$lib/server/waitlist.ts`'s own doc comment), only this
	 * component does. The hint sentence is not written here at all: `$lib/consent.ts`'s
	 * `CONSENT_COPY` is the one source both this component and `$lib/server/waitlist.ts`
	 * read, because issue #8 records that exact sentence as `waitlist_signup.consent_text`
	 * - a copy that only lived here could drift from what the database claims was shown.
	 */
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { CONSENT_COPY } from '$lib/consent';
	import { localeFromPathname, type Locale } from '$lib/i18n';

	let { form }: { form?: { ok?: boolean; error?: string } | null } = $props();
	let submitting = $state(false);
	let locale = $derived(localeFromPathname(page.url.pathname));

	const COPY: Record<
		Locale,
		{
			label: string;
			placeholder: string;
			join: string;
			joining: string;
			success: string;
			errors: Record<'invalid_email' | 'save_failed' | 'mail_failed' | 'empty_email', string>;
		}
	> = {
		en: {
			label: 'Get occasional emails about new Canonry features',
			placeholder: 'you@example.com',
			join: 'Subscribe',
			joining: 'Subscribing\u2026',
			success: "Check your email to confirm - one click and you're subscribed.",
			errors: {
				invalid_email: 'That does not look like an email address.',
				save_failed: 'Could not save that just now. Try again in a moment.',
				mail_failed: 'Could not send the confirmation email just now. Try again in a moment.',
				empty_email: 'Enter an email address.'
			}
		},
		it: {
			label: 'Ricevi email occasionali sulle novità di Canonry',
			placeholder: 'tu@esempio.com',
			join: 'Iscriviti',
			joining: 'Iscrizione in corso\u2026',
			success: 'Controlla la tua email per confermare: un clic e sei iscritto.',
			errors: {
				invalid_email: 'Non sembra un indirizzo email.',
				save_failed: 'Non siamo riusciti a salvarlo ora. Riprova tra poco.',
				mail_failed: "Non siamo riusciti a inviare l'email di conferma ora. Riprova tra poco.",
				empty_email: 'Inserisci un indirizzo email.'
			}
		}
	};
	let t = $derived(COPY[locale]);
	let hint = $derived(CONSENT_COPY[locale]);
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
	<label for="newsletter-email" class="text-sm font-medium text-ink">
		{t.label}
	</label>
	<p class="mt-1 text-xs text-ink-2">
		{hint}
	</p>

	<div class="mt-2 flex flex-wrap gap-2">
		<input
			id="newsletter-email"
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

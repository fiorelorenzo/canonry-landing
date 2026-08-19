/**
 * The exact sentence a visitor reads above the waiting list button, in each of the two
 * locales `WaitlistForm.svelte` renders (`$lib/i18n`) - the one piece of that form's copy
 * this repository can be asked to prove was shown, because `waitlist_signup.consent_text`
 * (migrations/0002_waitlist_consent.sql) stores this exact string against every new
 * signup. Shared between the client (`WaitlistForm.svelte` renders it as the form's hint)
 * and the server (`$lib/server/waitlist.ts` records it) so the two can never drift: a copy
 * edit here changes both what a visitor reads and what the database remembers they read,
 * in the same commit.
 */
import type { Locale } from './i18n';

export const CONSENT_COPY: Record<Locale, string> = {
	en: 'Your address goes on a list for exactly one email, when that is true. Never sold, never shared.',
	it: 'Il tuo indirizzo finisce in una lista per una sola email, quando sarà il momento. Mai venduto, mai condiviso.'
};

/** The two values `waitlist_signup.consent_scope`'s check constraint allows. This
 * repository writes `'launch_only'` only - `WaitlistForm.svelte` offers no newsletter
 * checkbox, so nothing here ever writes `'newsletter'`. The column carries the second
 * value for the day that checkbox exists, not built by issue #8. */
export type ConsentScope = 'launch_only' | 'newsletter';
export const LAUNCH_ONLY_SCOPE: ConsentScope = 'launch_only';

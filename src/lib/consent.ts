/**
 * The exact sentence a visitor reads above the newsletter button, in each of the two
 * locales `NewsletterForm.svelte` renders (`$lib/i18n`) - the one piece of that form's
 * copy this repository can be asked to prove was shown, because
 * `waitlist_signup.consent_text` (migrations/0002_waitlist_consent.sql) stores this
 * exact string against every new signup. Shared between the client
 * (`NewsletterForm.svelte` renders it as the form's hint) and the server
 * (`$lib/server/waitlist.ts` records it) so the two can never drift: a copy edit here
 * changes both what a visitor reads and what the database remembers they read, in the
 * same commit.
 *
 * M1 (docs/ux/DECISIONS.md, round eight): this form is no longer a launch waiting
 * list - the product is out, so a promise to email "when that is true" would be a
 * promise already broken the moment this page ships. It is now an explicitly named
 * newsletter, and the addresses collected under the old promise are not quietly
 * reinterpreted into this one: they keep the `launch_only` scope they were given,
 * this file only changes what a *new* signup writes.
 */
import type { Locale } from './i18n';

export const CONSENT_COPY: Record<Locale, string> = {
	en: 'Your address goes on a list for occasional emails about new Canonry features. Never sold, never shared.',
	it: 'Il tuo indirizzo finisce in una lista per email occasionali sulle novità di Canonry. Mai venduto, mai condiviso.'
};

/** The two values `waitlist_signup.consent_scope`'s check constraint allows. This
 * repository writes `'newsletter'` only, as of M1 - the old `'launch_only'` value
 * still lives on every row collected before this change (migration 0002's backfill,
 * and every signup this form recorded before it) and stays there untouched. */
export type ConsentScope = 'launch_only' | 'newsletter';
export const NEWSLETTER_SCOPE: ConsentScope = 'newsletter';

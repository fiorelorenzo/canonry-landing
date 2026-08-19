/**
 * The double opt-in click: looks up a row by its `confirm_token`
 * (migrations/0002_waitlist_consent.sql) and records the moment somebody actually
 * followed the link, distinct from the moment the form was submitted
 * (`consent_confirmed_at` stays null between the two). Idempotent on purpose -
 * revisiting an already-confirmed link (a mail client re-fetching it, a visitor clicking
 * twice) reports the same success rather than erroring, because a second click is not a
 * failure any more than a second form submission was (`$lib/server/waitlist.ts`'s own
 * reasoning).
 */
import type postgres from 'postgres';
import type { Locale } from '$lib/i18n';

// A token that never matched a valid uuid was never one this app minted (confirm_token's
// column default is gen_random_uuid()) - reject it before it reaches Postgres rather than
// letting an invalid-uuid cast error surface as a 500.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ConfirmResult = { ok: true; locale: Locale } | { ok: false };

export async function confirmSignup(client: postgres.Sql, token: string): Promise<ConfirmResult> {
	if (!UUID_PATTERN.test(token)) {
		return { ok: false };
	}

	const rows = await client<{ consent_locale: string }[]>`
		update waitlist_signup
		set consent_confirmed_at = coalesce(consent_confirmed_at, now())
		where confirm_token = ${token}
		returning consent_locale
	`;

	const row = rows[0];
	if (!row) {
		return { ok: false };
	}

	// consent_locale is 'en', 'it', or 0002's 'unknown' backfill for a pre-tracking row -
	// a row that old has no confirm_token anybody was ever sent, so this branch is
	// reachable only if the 'unknown' default is somehow queried directly; English is the
	// honest fallback rather than guessing.
	return { ok: true, locale: row.consent_locale === 'it' ? 'it' : 'en' };
}

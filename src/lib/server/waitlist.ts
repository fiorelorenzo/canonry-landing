/**
 * The waiting list capture. `normalizeEmail` is the pure half, tested without a
 * database; `subscribe` is the one query, taking its `postgres.Sql` as a parameter so
 * its own tests can pass a fake instead of opening a real connection. `handleSubscribe`
 * is the one form action both `/` and `/it` share (issue #129: two paths, one action,
 * neither route re-deriving the other's logic).
 *
 * Issue #8: a signup is no longer just a row. `subscribe` records what makes consent
 * demonstrable (`$lib/consent.ts`'s exact copy, the locale it was shown in, the scope -
 * 'launch_only', the only one `WaitlistForm.svelte` offers) and sends the double opt-in
 * link `$lib/server/confirmation-email.ts` builds; nothing is mailable
 * (`consent_confirmed_at is not null`) until the visitor follows it.
 *
 * "Duplicate email" is still success, not an error (a visitor pressing submit twice is
 * not a failure): the insert is `on conflict (email) do update ... where
 * consent_confirmed_at is null`, so a still-pending row gets its consent copy refreshed
 * and another confirmation email, while an already-confirmed or launch-only-backfilled
 * row (migrations/0002_waitlist_consent.sql) matches nothing, sends nothing, and still
 * reports `{ ok: true }` - resending a confirmed address's confirmation would only leak
 * whether that address is already on the list. The unique index on `email` is what makes
 * the statement race-safe either way.
 *
 * The insert and the mail send are two separate steps, deliberately not one transaction:
 * the write is the durable record that consent was given, and it survives a transport
 * hiccup rather than being rolled back by one. A mail failure is reported to the caller
 * as `mail_failed` rather than folded into `{ ok: true }` - resubmitting the same address
 * lands back in the same pending row and tries the send again with the same token.
 *
 * Errors are stable *codes*, not English sentences: this module has no opinion on the
 * visitor's language, `WaitlistForm.svelte` does (issue #129, `/it` renders the same
 * codes in Italian). A server action translating its own error text would be exactly
 * the kind of chrome-in-the-wrong-language bug #129 exists to avoid.
 */
import { fail } from '@sveltejs/kit';
import type postgres from 'postgres';
import { CONSENT_COPY, LAUNCH_ONLY_SCOPE } from '$lib/consent';
import type { Locale } from '$lib/i18n';
import { sendConfirmationEmail } from './confirmation-email';

// Deliberately permissive - anything address-shaped with an @ and a dot after it. This
// is a waiting list, not account creation: the cost of accepting a slightly malformed
// address is a bounced notification later, the cost of a false rejection is a lost
// signup on the one page whose entire job is to collect them.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trims and lowercases, then returns the address or `null` if it does not look like one. */
export function normalizeEmail(raw: string): string | null {
	const trimmed = raw.trim().toLowerCase();
	return EMAIL_PATTERN.test(trimmed) ? trimmed : null;
}

export type SubscribeErrorCode = 'invalid_email' | 'save_failed' | 'mail_failed';
export type SubscribeResult = { ok: true } | { ok: false; error: SubscribeErrorCode };

export async function subscribe(
	client: postgres.Sql,
	rawEmail: string,
	locale: Locale,
	origin: string
): Promise<SubscribeResult> {
	const email = normalizeEmail(rawEmail);
	if (!email) {
		return { ok: false, error: 'invalid_email' };
	}

	let token: string | undefined;
	try {
		const rows = await client<{ confirm_token: string }[]>`
			insert into waitlist_signup (email, consent_text, consent_locale, consent_scope)
			values (${email}, ${CONSENT_COPY[locale]}, ${locale}, ${LAUNCH_ONLY_SCOPE})
			on conflict (email) do update set
				consent_text = excluded.consent_text,
				consent_locale = excluded.consent_locale,
				consent_scope = excluded.consent_scope
			where waitlist_signup.consent_confirmed_at is null
			returning confirm_token
		`;
		token = rows[0]?.confirm_token;
	} catch {
		return { ok: false, error: 'save_failed' };
	}

	// No row back means the address is already confirmed or is one of the launch-only
	// rows the migration backfilled - nothing new to confirm, nothing to send.
	if (!token) {
		return { ok: true };
	}

	try {
		await sendConfirmationEmail({ to: email, token, locale, origin });
	} catch {
		return { ok: false, error: 'mail_failed' };
	}

	return { ok: true };
}

export type SubscribeActionErrorCode = SubscribeErrorCode | 'empty_email';
export interface SubscribeActionResult {
	ok: boolean;
	error?: SubscribeActionErrorCode;
}

/** The whole `?/subscribe` form action, shared by `src/routes/+page.server.ts` (English,
 * `/`) and `src/routes/it/+page.server.ts` (Italian, `/it`) - one implementation so the
 * two paths cannot drift, matching `subscribe`'s own reasoning above. `locale` and
 * `origin` come from the route itself rather than being guessed from the request, since
 * each of the two routes already knows which locale it is and SvelteKit's own
 * `event.url.origin` (adapter-node's `ORIGIN`-adjusted value) is the one this app's other
 * server code already trusts (`+layout.server.ts`). */
export async function handleSubscribe(
	client: postgres.Sql,
	request: Request,
	locale: Locale,
	origin: string
) {
	const data = await request.formData();
	const email = data.get('email');
	if (typeof email !== 'string' || email.trim() === '') {
		return fail(400, { ok: false, error: 'empty_email' } satisfies SubscribeActionResult);
	}

	const result = await subscribe(client, email, locale, origin);
	if (!result.ok) {
		return fail(400, { ok: false, error: result.error } satisfies SubscribeActionResult);
	}
	return { ok: true } satisfies SubscribeActionResult;
}

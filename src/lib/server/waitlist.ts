/**
 * The waiting list capture. `normalizeEmail` is the pure half, tested without a
 * database; `subscribe` is the one query, taking its `postgres.Sql` as a parameter so
 * its own tests can pass a fake instead of opening a real connection. `handleSubscribe`
 * is the one form action both `/` and `/it` share (issue #129: two paths, one action,
 * neither route re-deriving the other's logic).
 *
 * "Duplicate email" is success, not an error (a visitor pressing submit twice is not a
 * failure): the insert is `on conflict (email) do nothing`, and `subscribe` reports
 * `{ ok: true }` whether the row was newly written or already existed. The unique index
 * migrations/0001_waitlist_signup.sql puts on `email` is what makes that single
 * statement race-safe.
 *
 * Errors are stable *codes*, not English sentences: this module has no opinion on the
 * visitor's language, `WaitlistForm.svelte` does (issue #129, `/it` renders the same
 * codes in Italian). A server action translating its own error text would be exactly
 * the kind of chrome-in-the-wrong-language bug #129 exists to avoid.
 */
import { fail } from '@sveltejs/kit';
import type postgres from 'postgres';

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

export type SubscribeErrorCode = 'invalid_email' | 'save_failed';
export type SubscribeResult = { ok: true } | { ok: false; error: SubscribeErrorCode };

export async function subscribe(client: postgres.Sql, rawEmail: string): Promise<SubscribeResult> {
	const email = normalizeEmail(rawEmail);
	if (!email) {
		return { ok: false, error: 'invalid_email' };
	}

	try {
		await client`
			insert into waitlist_signup (email)
			values (${email})
			on conflict (email) do nothing
		`;
		return { ok: true };
	} catch {
		return { ok: false, error: 'save_failed' };
	}
}

export type SubscribeActionErrorCode = SubscribeErrorCode | 'empty_email';
export interface SubscribeActionResult {
	ok: boolean;
	error?: SubscribeActionErrorCode;
}

/** The whole `?/subscribe` form action, shared by `src/routes/+page.server.ts` (English,
 * `/`) and `src/routes/it/+page.server.ts` (Italian, `/it`) - one implementation so the
 * two paths cannot drift, matching `subscribe`'s own reasoning above. */
export async function handleSubscribe(client: postgres.Sql, request: Request) {
	const data = await request.formData();
	const email = data.get('email');
	if (typeof email !== 'string' || email.trim() === '') {
		return fail(400, { ok: false, error: 'empty_email' } satisfies SubscribeActionResult);
	}

	const result = await subscribe(client, email);
	if (!result.ok) {
		return fail(400, { ok: false, error: result.error } satisfies SubscribeActionResult);
	}
	return { ok: true } satisfies SubscribeActionResult;
}

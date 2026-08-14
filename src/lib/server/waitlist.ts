/**
 * The waiting list capture. `normalizeEmail` is the pure half, tested without a
 * database; `subscribe` is the one query, taking its `postgres.Sql` as a parameter so
 * its own tests can pass a fake instead of opening a real connection.
 *
 * "Duplicate email" is success, not an error (a visitor pressing submit twice is not a
 * failure): the insert is `on conflict (email) do nothing`, and `subscribe` reports
 * `{ ok: true }` whether the row was newly written or already existed. The unique index
 * migrations/0001_waitlist_signup.sql puts on `email` is what makes that single
 * statement race-safe.
 */
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

export type SubscribeResult = { ok: true } | { ok: false; error: string };

export async function subscribe(client: postgres.Sql, rawEmail: string): Promise<SubscribeResult> {
	const email = normalizeEmail(rawEmail);
	if (!email) {
		return { ok: false, error: 'That does not look like an email address.' };
	}

	try {
		await client`
			insert into waitlist_signup (email)
			values (${email})
			on conflict (email) do nothing
		`;
		return { ok: true };
	} catch {
		return { ok: false, error: 'Could not save that just now. Try again in a moment.' };
	}
}

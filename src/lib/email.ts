/**
 * The one rule this repository has about what an email address looks like, in its own
 * module because two callers need exactly the same answer: `$lib/server/waitlist.ts`
 * deciding whether to accept a signup, and `$lib/server/launch-notify.ts` (issue #14)
 * deciding whether a row already in the table can be mailed at all. A second copy of
 * this regex would be a second definition of "mailable", and the launch notification is
 * the last mail those addresses are owed, so the two answers have to be the same one.
 */

// Deliberately permissive - anything address-shaped with an @ and a dot after it. This
// is a newsletter signup, not account creation: the cost of accepting a slightly
// malformed address is a bounced email later, the cost of a false rejection is a lost
// signup on the one page whose entire job is to collect them.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trims and lowercases, then returns the address or `null` if it does not look like one. */
export function normalizeEmail(raw: string): string | null {
	const trimmed = raw.trim().toLowerCase();
	return EMAIL_PATTERN.test(trimmed) ? trimmed : null;
}

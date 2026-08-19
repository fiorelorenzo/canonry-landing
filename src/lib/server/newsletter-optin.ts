/**
 * The choice the launch notification offers (issue #14). A launch-only row asked to be told
 * about the launch and nothing wider, so the newsletter is opt-in by an affirmative act:
 * following the link in that email is the act, and this is where it is recorded.
 *
 * What it writes is the same evidence a fresh signup writes (`$lib/server/waitlist.ts`), for
 * the same reason M1 gives: `consent_scope` becomes 'newsletter', `consent_text` becomes the
 * exact sentence the email put next to the link (`$lib/consent.ts`'s `CONSENT_COPY`, which is
 * also what `$lib/server/launch-email.ts` renders, so the two cannot drift), `consent_locale`
 * is the language of the link that was followed, and `newsletter_opted_in_at` is the moment
 * it happened, kept distinct from the original `created_at` so the row still shows what was
 * agreed to when.
 *
 * Idempotent, like the double opt-in click next to it: a second visit rewrites the same
 * values and leaves both timestamps at their first value, because clicking twice is not a
 * second decision.
 *
 * The link is only ever disclosed in that one email, so possession of the token is the whole
 * authorization. There is no page on this site that links here.
 */
import type postgres from 'postgres';
import { CONSENT_COPY, NEWSLETTER_SCOPE } from '$lib/consent';
import type { Locale } from '$lib/i18n';
import { CONFIRM_TOKEN_PATTERN } from '$lib/token';

export type NewsletterOptInResult = { ok: true } | { ok: false };

export async function optInToNewsletter(
	client: postgres.Sql,
	token: string,
	locale: Locale
): Promise<NewsletterOptInResult> {
	if (!CONFIRM_TOKEN_PATTERN.test(token)) {
		return { ok: false };
	}

	const rows = await client<{ id: string }[]>`
		update waitlist_signup
		set consent_scope = ${NEWSLETTER_SCOPE},
			consent_text = ${CONSENT_COPY[locale]},
			consent_locale = ${locale},
			consent_confirmed_at = coalesce(consent_confirmed_at, now()),
			newsletter_opted_in_at = coalesce(newsletter_opted_in_at, now())
		where confirm_token = ${token}
		returning id
	`;

	return rows[0] ? { ok: true } : { ok: false };
}

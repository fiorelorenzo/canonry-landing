/**
 * `waitlist_signup.confirm_token` is a uuid (migrations/0002_waitlist_consent.sql, column
 * default `gen_random_uuid()`), and two routes now look a row up by one: the double opt-in
 * click (`$lib/server/confirm.ts`) and the newsletter opt-in the launch notification offers
 * (`$lib/server/newsletter-optin.ts`, issue #14). Both reject a non-uuid before it reaches
 * Postgres rather than letting an invalid-uuid cast error surface as a 500, and both have to
 * reject exactly the same set of strings, so the pattern lives here rather than twice.
 *
 * A match says only that the string could be a token this app minted. Whether a row carries
 * it is a question only the database answers.
 */
export const CONFIRM_TOKEN_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

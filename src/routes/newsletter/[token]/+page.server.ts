/**
 * The newsletter opt-in the launch notification offers, English (issue #14).
 * `$lib/server/newsletter-optin.ts` does the whole thing; this file supplies the connection
 * and the token, the same one-line-wrapper shape `/confirm/[token]` uses. No form and no
 * action: following the link is the decision, so `load` records it.
 *
 * The locale is the route's, not the row's: this path is the one the English email links to,
 * so English is the language whose consent sentence the reader actually saw.
 */
import { sql } from '$lib/server/db';
import { optInToNewsletter } from '$lib/server/newsletter-optin';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => optInToNewsletter(sql(), params.token, 'en');

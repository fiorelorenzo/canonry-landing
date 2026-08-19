/**
 * The newsletter opt-in the launch notification offers, Italian (issue #14) - the counterpart
 * of `/newsletter/[token]`, on its own path the way everything Italian is here (`$lib/i18n`).
 * The Italian email links here, so Italian is the language whose consent sentence the reader
 * saw, and that is what the row records.
 */
import { sql } from '$lib/server/db';
import { optInToNewsletter } from '$lib/server/newsletter-optin';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => optInToNewsletter(sql(), params.token, 'it');

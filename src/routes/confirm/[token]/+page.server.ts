/**
 * The double opt-in click. `$lib/server/confirm.ts`'s `confirmSignup` does the whole
 * thing - this file only supplies the connection and the token from the URL, the same
 * one-line-wrapper shape `/` and `/it`'s own `+page.server.ts` use for `handleSubscribe`.
 * No form, no action: following the link is the confirmation, so `load` performs it.
 */
import { sql } from '$lib/server/db';
import { confirmSignup } from '$lib/server/confirm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => confirmSignup(sql(), params.token);

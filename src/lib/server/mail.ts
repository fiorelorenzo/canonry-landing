/**
 * This app's own mail transport, as everything running inside SvelteKit sees it: the
 * Resend POST from `./resend.ts` with `RESEND_API_KEY` and `MAIL_FROM` read out of
 * `$env/dynamic/private` and the missing one named rather than failing silently.
 *
 * Those two variables are this app's own, not the canonry product repository's: a separate
 * Resend-scoped sending key for `canonry.io`, because this is a separate deployment with
 * its own secrets, not a second consumer of `apps/web`'s `MailTransport` over there.
 *
 * The request itself lives in `./resend.ts` rather than here because issue #14's launch
 * notification sends from a plain node script, where `$env/dynamic/private` does not
 * resolve: that script builds the same transport from `process.env` instead of this
 * module, and both go out through the one verified domain either way.
 */
import { env } from '$env/dynamic/private';
import { resendTransport, type MailMessage, type SendMailResult } from './resend';

export type { MailMessage, SendMailResult } from './resend';

export async function sendMail(message: MailMessage): Promise<SendMailResult> {
	if (!env.RESEND_API_KEY) {
		throw new Error('RESEND_API_KEY is not set, so there is no way to send this email');
	}
	if (!env.MAIL_FROM) {
		throw new Error('MAIL_FROM is not set, so there is no way to send this email');
	}

	return resendTransport({ apiKey: env.RESEND_API_KEY, from: env.MAIL_FROM })(message);
}

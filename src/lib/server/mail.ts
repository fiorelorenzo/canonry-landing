/**
 * This app's own mail transport: one function, one dependency (the platform `fetch`),
 * talking to Resend's REST API directly rather than pulling in its SDK. The confirmation
 * email issue #8's double opt-in needs is the only thing this repository ever sends, so a
 * client library built for arbitrary usage would cost more surface than the one POST this
 * makes - the same reasoning `$lib/server/db.ts` gives for a raw `postgres` client over an
 * ORM.
 *
 * `RESEND_API_KEY` and `MAIL_FROM` are this app's own, not the canonry product
 * repository's: a separate Resend-scoped sending key for `canonry.io`, because this is a
 * separate deployment with its own secrets, not a second consumer of `apps/web`'s
 * `MailTransport` over there. Never logged and never folded into a thrown error message -
 * a failed send reports the response status, not the request that produced it.
 */
import { env } from '$env/dynamic/private';

export interface SendMailInput {
	to: string;
	subject: string;
	html: string;
	text: string;
}

/** Resend's own id for the accepted send, useful for support and for proving delivery in
 * a manual check - never persisted, this app has no outbox table to put it in. */
export interface SendMailResult {
	id: string;
}

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
	if (!env.RESEND_API_KEY) {
		throw new Error('RESEND_API_KEY is not set, so there is no way to send this email');
	}
	if (!env.MAIL_FROM) {
		throw new Error('MAIL_FROM is not set, so there is no way to send this email');
	}

	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			authorization: `Bearer ${env.RESEND_API_KEY}`,
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			from: env.MAIL_FROM,
			to: input.to,
			subject: input.subject,
			html: input.html,
			text: input.text
		})
	});

	if (!response.ok) {
		throw new Error(`Resend rejected the send: ${response.status} ${response.statusText}`);
	}

	const body = (await response.json()) as { id: string };
	return { id: body.id };
}

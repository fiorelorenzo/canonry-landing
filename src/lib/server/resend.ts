/**
 * The Resend POST itself, taking its key and its from-header as arguments rather than
 * reading them from anywhere. `./mail.ts` is the thin wrapper that reads them from
 * `$env/dynamic/private` for everything running inside SvelteKit; this module exists
 * separately because issue #14's send runs from a plain node script
 * (`scripts/send-launch-notification.ts`), where `$env/dynamic/private` does not resolve
 * and duplicating the request would mean two versions of how this app talks to Resend.
 *
 * One dependency, the platform `fetch`, and no SDK: the two things this repository sends
 * (a confirmation link, and the one launch notification) cost less as one POST than a
 * client library built for arbitrary usage would. The key is never logged and never folded
 * into a thrown error message - a failed send reports the response status, not the request
 * that produced it.
 */
export interface MailMessage {
	to: string;
	subject: string;
	html: string;
	text: string;
}

/** Resend's own id for the accepted send. `launch_notification_attempt.provider_message_id`
 * keeps it for the launch notification (issue #14); the confirmation email has no outbox
 * table to put it in and only returns it to its caller. */
export interface SendMailResult {
	id: string;
}

/** Anything that can deliver a message. `resendTransport` is the real one; a test passes a
 * fake, and `scripts/send-launch-notification.ts`'s rehearsal mode passes one that prints
 * instead of reaching the network. */
export type MailTransport = (message: MailMessage) => Promise<SendMailResult>;

export interface ResendConfig {
	apiKey: string;
	/** The `Name <address>` from header, on the verified `canonry.io` domain. */
	from: string;
}

export function resendTransport(config: ResendConfig): MailTransport {
	return async (message) => {
		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				authorization: `Bearer ${config.apiKey}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				from: config.from,
				to: message.to,
				subject: message.subject,
				html: message.html,
				text: message.text
			})
		});

		if (!response.ok) {
			throw new Error(`Resend rejected the send: ${response.status} ${response.statusText}`);
		}

		const body = (await response.json()) as { id: string };
		return { id: body.id };
	};
}

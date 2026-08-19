/**
 * The one email this app sends: the double opt-in link issue #8's consent record needs.
 * `$lib/server/waitlist.ts`'s `subscribe` calls this right after a new or still-pending
 * row commits, with that row's own `confirm_token`. `$lib/server/mail.ts` is the
 * transport; this module only knows what to say, and in which of the two locales
 * `WaitlistForm.svelte` offers - the same `Locale` the signup itself was recorded under.
 */
import { sendMail, type SendMailResult } from './mail';
import type { Locale } from '$lib/i18n';

const COPY: Record<
	Locale,
	{ subject: string; text: (link: string) => string; html: (link: string) => string }
> = {
	en: {
		subject: 'Confirm your Canonry launch notification',
		text: (link) =>
			`Click to confirm you want to hear when Canonry launches:\n\n${link}\n\n` +
			`If you did not ask for this, ignore this email - nothing else happens.`,
		html: (link) =>
			`<p>Click to confirm you want to hear when Canonry launches:</p>` +
			`<p><a href="${link}">${link}</a></p>` +
			`<p>If you did not ask for this, ignore this email - nothing else happens.</p>`
	},
	it: {
		subject: 'Conferma la tua iscrizione a Canonry',
		text: (link) =>
			`Clicca per confermare che vuoi essere avvisato al lancio di Canonry:\n\n${link}\n\n` +
			`Se non hai richiesto questo, ignora questa email: non succede nient'altro.`,
		html: (link) =>
			`<p>Clicca per confermare che vuoi essere avvisato al lancio di Canonry:</p>` +
			`<p><a href="${link}">${link}</a></p>` +
			`<p>Se non hai richiesto questo, ignora questa email: non succede nient'altro.</p>`
	}
};

export interface SendConfirmationEmailInput {
	to: string;
	token: string;
	locale: Locale;
	/** `event.url.origin` from the action that captured the signup - `https://canonry.io`
	 * deployed, `http://127.0.0.1:5195` locally (see `docker/compose.yml`'s `ORIGIN`). */
	origin: string;
}

export function sendConfirmationEmail(input: SendConfirmationEmailInput): Promise<SendMailResult> {
	const link = `${input.origin}/confirm/${input.token}`;
	const copy = COPY[input.locale];
	return sendMail({
		to: input.to,
		subject: copy.subject,
		text: copy.text(link),
		html: copy.html(link)
	});
}

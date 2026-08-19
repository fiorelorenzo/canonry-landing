/**
 * The launch notification (issue #14): the one email owed to the addresses collected under
 * the old promise, before this form became a newsletter. M1 (canonry repository,
 * docs/ux/DECISIONS.md, round eight) is what it has to obey: those people asked to be told
 * when Canonry launched, so the mail says that and stops, and it asks about anything wider
 * instead of assuming it.
 *
 * Which is why the opt-in is a link and not a footer: following it is the affirmative act,
 * `$lib/server/newsletter-optin.ts` records the new scope at the moment it happens, and the
 * sentence next to the link is `$lib/consent.ts`'s `CONSENT_COPY` verbatim, so what the
 * database claims was shown is exactly what was in this email. Saying nothing keeps the
 * original promise: they have now been told, and they hear from us never again.
 *
 * The copy also inherits the page's guardrails (AGENTS.md): the copilot flags what does not
 * add up rather than certifying that a canon is coherent, nothing joins the canon without
 * the reader accepting it, generation costs credits against a ceiling that is a published
 * number and not "unlimited", and there is no feature tour and no generated art.
 *
 * Imports are relative with explicit extensions on purpose: this module is loaded both by
 * SvelteKit and directly by `scripts/send-launch-notification.ts` under node's own type
 * stripping, where `$lib/...` does not resolve. Type-only imports are erased before node
 * ever sees them, so `Locale` can stay aliased.
 */
import type { Locale } from '$lib/i18n';
import { CONSENT_COPY } from '../consent.ts';
import { APP_SIGN_UP_URL } from '../app.ts';

export interface LaunchEmailInput {
	/** The row's own `confirm_token`, which is the newsletter opt-in link's secret. It has
	 * never been disclosed for a launch-only row: migration 0002 minted it and no mail has
	 * ever carried it, so this email is the first and only place it appears. */
	token: string;
	locale: Locale;
	/** This site's public origin, `https://canonry.io` in production. Every link in the mail
	 * is built from it, so a rehearsal against the local stack links to the local stack. */
	origin: string;
}

export interface RenderedEmail {
	subject: string;
	text: string;
	html: string;
}

/** `/newsletter/<token>` in English, `/it/newsletter/<token>` in Italian: this repository
 * puts Italian on its own path rather than behind a parameter ($lib/i18n), and the route the
 * click lands on is what tells the opt-in which language the consent sentence was read in. */
const OPT_IN_PATH: Record<Locale, string> = { en: '/newsletter', it: '/it/newsletter' };
const PRICING_PATH: Record<Locale, string> = { en: '/pricing', it: '/it/pricing' };

const COPY: Record<
	Locale,
	{ subject: string; paragraphs: (links: { optIn: string; pricing: string }) => string[] }
> = {
	en: {
		subject: 'Canonry is live',
		paragraphs: ({ optIn, pricing }) => [
			`You asked to be told when Canonry launched. It has. app.canonry.io is open, and a free account is enough to start a world: ${APP_SIGN_UP_URL}`,
			`That is what this email is for, so the rest of it is short. Canonry is a wiki for your world with a copilot that drafts entries and flags what does not add up, and never writes anything into your canon until you accept it yourself. Reading is free: search, entries and relations cost nothing. Generation is charged in credits, and the included plan has a fixed monthly ceiling, a published number rather than a soft limit, which is not decided yet. ${pricing} says what is settled and what is not.`,
			`About your address. You gave it to be told about the launch and nothing wider, so unless you tell us otherwise this is the last email you get from us. It is on no other list.`,
			`If you would like to hear from us occasionally, one click is all it takes:`,
			optIn,
			CONSENT_COPY.en,
			`Ignore this and nothing happens, which is the right outcome for most people reading it. If you would rather the address were deleted, write to privacy@canonry.io and we delete the row, address included.`,
			`Lorenzo`
		]
	},
	it: {
		subject: 'Canonry è online',
		paragraphs: ({ optIn, pricing }) => [
			`Avevi chiesto di essere avvisato quando Canonry fosse uscito. È uscito. app.canonry.io è aperto, e per iniziare un mondo basta un account gratuito: ${APP_SIGN_UP_URL}`,
			`Questa email serve a dirti questo, quindi il resto è breve. Canonry è un wiki per il tuo mondo con un copilota che prepara le bozze e segnala quello che non torna, e non scrive mai niente nel tuo canone finché non lo accetti tu. Leggere è gratis: ricerca, voci e relazioni non costano nulla. La generazione si paga in crediti, e il piano incluso ha un tetto mensile fisso, un numero pubblicato e non un limite morbido, che però non è ancora deciso. Su ${pricing} c'è cosa è deciso e cosa no.`,
			`Sul tuo indirizzo. L'hai dato per essere avvisato del lancio e per niente di più, quindi questa è l'ultima email che ricevi da noi, a meno che tu non ci dica il contrario. Non è in nessun'altra lista.`,
			`Se ti va di sentirci di tanto in tanto, basta un clic:`,
			optIn,
			CONSENT_COPY.it,
			`Se ignori questa email non succede niente, ed è il risultato giusto per la maggior parte di chi la legge. Se preferisci che l'indirizzo venga cancellato, scrivi a privacy@canonry.io e cancelliamo la riga, indirizzo compreso.`,
			`Lorenzo`
		]
	}
};

export function renderLaunchEmail(input: LaunchEmailInput): RenderedEmail {
	const optIn = `${input.origin}${OPT_IN_PATH[input.locale]}/${input.token}`;
	const pricing = `${input.origin}${PRICING_PATH[input.locale]}`;
	const copy = COPY[input.locale];
	const paragraphs = copy.paragraphs({ optIn, pricing });

	return {
		subject: copy.subject,
		text: paragraphs.join('\n\n'),
		// The opt-in paragraph is the one line that has to be clickable; every other URL in
		// the mail is left as text on purpose, so a reader can see where each one goes before
		// deciding to follow it.
		html: paragraphs
			.map((paragraph) =>
				paragraph === optIn
					? `<p><a href="${optIn}">${optIn}</a></p>`
					: `<p>${paragraph.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`
			)
			.join('\n')
	};
}

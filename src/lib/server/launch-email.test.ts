import { describe, expect, it } from 'vitest';
import { CONSENT_COPY } from '$lib/consent';
import { renderLaunchEmail } from './launch-email';

const TOKEN = '11111111-2222-4333-8444-555555555555';
const ORIGIN = 'https://canonry.io';

describe('renderLaunchEmail', () => {
	it('links the English opt-in at /newsletter/<token> and the Italian one under /it', () => {
		const en = renderLaunchEmail({ token: TOKEN, locale: 'en', origin: ORIGIN });
		const it = renderLaunchEmail({ token: TOKEN, locale: 'it', origin: ORIGIN });

		expect(en.text).toContain(`${ORIGIN}/newsletter/${TOKEN}`);
		expect(it.text).toContain(`${ORIGIN}/it/newsletter/${TOKEN}`);
		expect(en.text).not.toContain('/it/newsletter');
	});

	it('builds every link from the origin it is given, so a rehearsal never links to production', () => {
		const local = renderLaunchEmail({
			token: TOKEN,
			locale: 'en',
			origin: 'http://127.0.0.1:5195'
		});

		expect(local.text).toContain(`http://127.0.0.1:5195/newsletter/${TOKEN}`);
		expect(local.text).toContain('http://127.0.0.1:5195/pricing');
		expect(local.text).not.toContain('https://canonry.io/pricing');
	});

	// The row's consent_text is set to this exact sentence when somebody follows the link
	// ($lib/server/newsletter-optin.ts), so the mail has to be where they read it. A drift here
	// would make the database claim a sentence nobody was shown.
	it('shows the consent sentence the opt-in will record, verbatim, in each language', () => {
		expect(renderLaunchEmail({ token: TOKEN, locale: 'en', origin: ORIGIN }).text).toContain(
			CONSENT_COPY.en
		);
		expect(renderLaunchEmail({ token: TOKEN, locale: 'it', origin: ORIGIN }).text).toContain(
			CONSENT_COPY.it
		);
	});

	it('says what generation costs and never calls the quota unlimited', () => {
		for (const locale of ['en', 'it'] as const) {
			const mail = renderLaunchEmail({ token: TOKEN, locale, origin: ORIGIN });
			expect(mail.text.toLowerCase()).not.toContain('unlimited');
			expect(mail.text.toLowerCase()).not.toContain('illimitat');
			expect(mail.text).toContain(locale === 'en' ? 'monthly ceiling' : 'tetto mensile');
		}
	});

	it('makes only the opt-in clickable in the HTML, and escapes the rest', () => {
		const mail = renderLaunchEmail({ token: TOKEN, locale: 'en', origin: ORIGIN });
		const anchors = mail.html.match(/<a /g) ?? [];

		expect(anchors).toHaveLength(1);
		expect(mail.html).toContain(`<a href="${ORIGIN}/newsletter/${TOKEN}">`);
		// The plain-text body is the source of truth for what the mail says; the HTML is the same
		// paragraphs, so every paragraph of one has to appear in the other.
		expect(mail.html).toContain('<p>Lorenzo</p>');
	});

	it('subjects say the one thing the mail is for, in each language', () => {
		expect(renderLaunchEmail({ token: TOKEN, locale: 'en', origin: ORIGIN }).subject).toBe(
			'Canonry is live'
		);
		expect(renderLaunchEmail({ token: TOKEN, locale: 'it', origin: ORIGIN }).subject).toBe(
			'Canonry è online'
		);
	});
});

import { describe, expect, it } from 'vitest';
import type { Sql } from 'postgres';
import { CONSENT_COPY } from '$lib/consent';
import { optInToNewsletter } from './newsletter-optin';

const TOKEN = '11111111-2222-4333-8444-555555555555';

/** The one statement `optInToNewsletter` runs. `matched: false` is a token no row carries. */
function fakeSql(matched = true) {
	const calls: { text: string; values: unknown[] }[] = [];
	const fn = async (strings: TemplateStringsArray, ...values: unknown[]) => {
		calls.push({ text: strings.join('?').replace(/\s+/g, ' ').trim(), values });
		return matched ? [{ id: 'signup-a' }] : [];
	};
	return { sql: fn as unknown as Sql, calls };
}

describe('optInToNewsletter', () => {
	it('rejects a token this app could never have minted, without touching the database', async () => {
		const db = fakeSql();

		await expect(optInToNewsletter(db.sql, 'not-a-uuid', 'en')).resolves.toEqual({ ok: false });
		expect(db.calls).toHaveLength(0);
	});

	it('records the new scope, and the sentence the mail showed in that language', async () => {
		const db = fakeSql();

		await expect(optInToNewsletter(db.sql, TOKEN, 'it')).resolves.toEqual({ ok: true });
		const [call] = db.calls;
		expect(call.values).toEqual(['newsletter', CONSENT_COPY.it, 'it', TOKEN]);
		expect(call.text).toContain('newsletter_opted_in_at = coalesce(newsletter_opted_in_at, now())');
	});

	it('keeps the first click as the moment consent was given, so a second one is not a new decision', async () => {
		const db = fakeSql();

		await optInToNewsletter(db.sql, TOKEN, 'en');

		const [call] = db.calls;
		expect(call.text).toContain('consent_confirmed_at = coalesce(consent_confirmed_at, now())');
		expect(call.text).toContain('newsletter_opted_in_at = coalesce(newsletter_opted_in_at, now())');
	});

	it('reports failure for a token no row carries, rather than claiming success', async () => {
		const db = fakeSql(false);

		await expect(optInToNewsletter(db.sql, TOKEN, 'en')).resolves.toEqual({ ok: false });
	});
});

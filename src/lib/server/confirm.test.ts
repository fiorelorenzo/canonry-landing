import { describe, expect, it } from 'vitest';
import type { Sql } from 'postgres';
import { confirmSignup } from './confirm';

const VALID_TOKEN = '11111111-1111-4111-8111-111111111111';

/** A minimal fake of the one tagged-template call `confirmSignup` makes. `row` is what
 * the update...returning gives back, or `undefined` for no matching token. */
function fakeSql(row?: { consent_locale: string }) {
	const calls: unknown[][] = [];
	const fn = (_strings: TemplateStringsArray, ...values: unknown[]) => {
		calls.push(values);
		return Promise.resolve(row ? [row] : []);
	};
	return { fn: fn as unknown as Sql, calls };
}

describe('confirmSignup', () => {
	it('rejects a token that is not shaped like a uuid, without touching the database', async () => {
		const { fn, calls } = fakeSql();
		const result = await confirmSignup(fn, 'not-a-token');
		expect(result).toEqual({ ok: false });
		expect(calls).toHaveLength(0);
	});

	it('reports failure when no row matches the token', async () => {
		const { fn } = fakeSql(undefined);
		const result = await confirmSignup(fn, VALID_TOKEN);
		expect(result).toEqual({ ok: false });
	});

	it('confirms a matching row and reports the locale it was signed up under', async () => {
		const { fn, calls } = fakeSql({ consent_locale: 'it' });
		const result = await confirmSignup(fn, VALID_TOKEN);
		expect(result).toEqual({ ok: true, locale: 'it' });
		expect(calls[0]).toEqual([VALID_TOKEN]);
	});

	it('falls back to English for any locale value other than it', async () => {
		const { fn } = fakeSql({ consent_locale: 'unknown' });
		const result = await confirmSignup(fn, VALID_TOKEN);
		expect(result).toEqual({ ok: true, locale: 'en' });
	});
});

import { describe, expect, it } from 'vitest';
import type { Sql } from 'postgres';
import { isActionFailure } from '@sveltejs/kit';
import { handleSubscribe, normalizeEmail, subscribe } from './waitlist';

describe('normalizeEmail', () => {
	it('trims and lowercases an address-shaped string', () => {
		expect(normalizeEmail('  Gm@Example.COM  ')).toBe('gm@example.com');
	});

	it('rejects strings with no @ or no dot after it', () => {
		expect(normalizeEmail('not-an-email')).toBeNull();
		expect(normalizeEmail('gm@example')).toBeNull();
		expect(normalizeEmail('')).toBeNull();
	});
});

/** A minimal fake of the one tagged-template call `subscribe` makes, so this test never
 * opens a real connection. */
function fakeSql(behavior: 'insert' | 'throw' = 'insert') {
	const calls: unknown[] = [];
	const fn = (strings: TemplateStringsArray, ...values: unknown[]) => {
		calls.push(values);
		if (behavior === 'throw') throw new Error('connection refused');
		return Promise.resolve([]);
	};
	return { fn: fn as unknown as Sql, calls };
}

describe('subscribe', () => {
	it('rejects an invalid address without touching the database', async () => {
		const { fn, calls } = fakeSql();
		const result = await subscribe(fn, 'nope');
		expect(result).toEqual({ ok: false, error: 'invalid_email' });
		expect(calls).toHaveLength(0);
	});

	it('normalizes the address before it reaches the query', async () => {
		const { fn, calls } = fakeSql();
		const result = await subscribe(fn, '  GM@Example.com ');
		expect(result).toEqual({ ok: true });
		expect(calls[0]).toEqual(['gm@example.com']);
	});

	it('reports success even when the insert hits the query twice (the on-conflict path)', async () => {
		// The real safety net is the database's unique index + ON CONFLICT DO NOTHING;
		// this only proves subscribe() does not itself turn a second call into an error.
		const { fn } = fakeSql();
		const first = await subscribe(fn, 'gm@example.com');
		const second = await subscribe(fn, 'gm@example.com');
		expect(first).toEqual({ ok: true });
		expect(second).toEqual({ ok: true });
	});

	it('turns a database failure into a reportable error rather than throwing', async () => {
		const { fn } = fakeSql('throw');
		const result = await subscribe(fn, 'gm@example.com');
		expect(result.ok).toBe(false);
	});
});

describe('handleSubscribe', () => {
	function formRequest(email: string | null): Request {
		const body = new URLSearchParams();
		if (email !== null) body.set('email', email);
		return new Request('http://example.test/?/subscribe', { method: 'POST', body });
	}

	it('fails with empty_email when the field is blank, without calling subscribe', async () => {
		const { fn, calls } = fakeSql();
		const result = await handleSubscribe(fn, formRequest('  '));
		if (!isActionFailure(result)) throw new Error('expected an ActionFailure');
		expect(result.status).toBe(400);
		expect(result.data).toEqual({ ok: false, error: 'empty_email' });
		expect(calls).toHaveLength(0);
	});

	it('fails with empty_email when the field is missing entirely', async () => {
		const result = await handleSubscribe(fakeSql().fn, formRequest(null));
		if (!isActionFailure(result)) throw new Error('expected an ActionFailure');
		expect(result.status).toBe(400);
		expect(result.data).toEqual({ ok: false, error: 'empty_email' });
	});

	it('delegates a real address to subscribe and reports its outcome', async () => {
		const { fn } = fakeSql();
		const result = await handleSubscribe(fn, formRequest('gm@example.com'));
		expect(result).toEqual({ ok: true });
	});
});

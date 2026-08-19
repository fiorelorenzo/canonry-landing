import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Sql } from 'postgres';
import { isActionFailure } from '@sveltejs/kit';

vi.mock('./confirmation-email', () => ({ sendConfirmationEmail: vi.fn() }));

import { sendConfirmationEmail } from './confirmation-email';
import { handleSubscribe, subscribe } from './waitlist';

const ORIGIN = 'http://127.0.0.1:5195';

/** A minimal fake of the one tagged-template call `subscribe` makes, so this test never
 * opens a real connection. `behavior: 'insert'` simulates the row the on-conflict-do-update
 * returns for a new or still-pending signup; `'no-row'` simulates an already-confirmed or
 * launch-only-backfilled address, where the WHERE clause matches nothing; `'throw'`
 * simulates a database failure. */
function fakeSql(behavior: 'insert' | 'no-row' | 'throw' = 'insert') {
	const calls: unknown[][] = [];
	const fn = (_strings: TemplateStringsArray, ...values: unknown[]) => {
		calls.push(values);
		if (behavior === 'throw') throw new Error('connection refused');
		if (behavior === 'no-row') return Promise.resolve([]);
		return Promise.resolve([{ confirm_token: '11111111-1111-4111-8111-111111111111' }]);
	};
	return { fn: fn as unknown as Sql, calls };
}

describe('subscribe', () => {
	beforeEach(() => {
		vi.mocked(sendConfirmationEmail).mockReset().mockResolvedValue({ id: 'resend-id' });
	});

	it('rejects an invalid address without touching the database', async () => {
		const { fn, calls } = fakeSql();
		const result = await subscribe(fn, 'nope', 'en', ORIGIN);
		expect(result).toEqual({ ok: false, error: 'invalid_email' });
		expect(calls).toHaveLength(0);
		expect(sendConfirmationEmail).not.toHaveBeenCalled();
	});

	it('normalizes the address and records the locale-appropriate consent copy', async () => {
		const { fn, calls } = fakeSql();
		const result = await subscribe(fn, '  GM@Example.com ', 'en', ORIGIN);
		expect(result).toEqual({ ok: true });
		expect(calls[0]).toEqual([
			'gm@example.com',
			'Your address goes on a list for occasional emails about new Canonry features. Never sold, never shared.',
			'en',
			'newsletter'
		]);
	});

	it('sends the confirmation email for a new or still-pending signup, in the given locale', async () => {
		const { fn } = fakeSql();
		await subscribe(fn, 'gm@example.com', 'it', ORIGIN);
		expect(sendConfirmationEmail).toHaveBeenCalledWith({
			to: 'gm@example.com',
			token: '11111111-1111-4111-8111-111111111111',
			locale: 'it',
			origin: ORIGIN
		});
	});

	it('does not send another confirmation when the address is already confirmed or launch-only', async () => {
		const { fn } = fakeSql('no-row');
		const result = await subscribe(fn, 'gm@example.com', 'en', ORIGIN);
		expect(result).toEqual({ ok: true });
		expect(sendConfirmationEmail).not.toHaveBeenCalled();
	});

	it('reports mail_failed when the send fails, without losing the row already written', async () => {
		vi.mocked(sendConfirmationEmail).mockRejectedValue(new Error('resend down'));
		const { fn } = fakeSql();
		const result = await subscribe(fn, 'gm@example.com', 'en', ORIGIN);
		expect(result).toEqual({ ok: false, error: 'mail_failed' });
	});

	it('turns a database failure into a reportable error rather than throwing', async () => {
		const { fn } = fakeSql('throw');
		const result = await subscribe(fn, 'gm@example.com', 'en', ORIGIN);
		expect(result).toEqual({ ok: false, error: 'save_failed' });
		expect(sendConfirmationEmail).not.toHaveBeenCalled();
	});
});

describe('handleSubscribe', () => {
	beforeEach(() => {
		vi.mocked(sendConfirmationEmail).mockReset().mockResolvedValue({ id: 'resend-id' });
	});

	afterEach(() => {
		vi.mocked(sendConfirmationEmail).mockReset();
	});

	function formRequest(email: string | null): Request {
		const body = new URLSearchParams();
		if (email !== null) body.set('email', email);
		return new Request('http://example.test/?/subscribe', { method: 'POST', body });
	}

	it('fails with empty_email when the field is blank, without calling subscribe', async () => {
		const { fn, calls } = fakeSql();
		const result = await handleSubscribe(fn, formRequest('  '), 'en', ORIGIN);
		if (!isActionFailure(result)) throw new Error('expected an ActionFailure');
		expect(result.status).toBe(400);
		expect(result.data).toEqual({ ok: false, error: 'empty_email' });
		expect(calls).toHaveLength(0);
	});

	it('fails with empty_email when the field is missing entirely', async () => {
		const result = await handleSubscribe(fakeSql().fn, formRequest(null), 'en', ORIGIN);
		if (!isActionFailure(result)) throw new Error('expected an ActionFailure');
		expect(result.status).toBe(400);
		expect(result.data).toEqual({ ok: false, error: 'empty_email' });
	});

	it('delegates a real address to subscribe, threading its own locale through', async () => {
		const { fn } = fakeSql();
		const result = await handleSubscribe(fn, formRequest('gm@example.com'), 'it', ORIGIN);
		expect(result).toEqual({ ok: true });
		expect(sendConfirmationEmail).toHaveBeenCalledWith(
			expect.objectContaining({ locale: 'it', origin: ORIGIN })
		);
	});
});

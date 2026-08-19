import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// `$env/dynamic/private` reads real process env (the real .env file included) when
// imported unmocked, so this file replaces the module outright rather than stubbing
// individual variables - a stub can leave the real RESEND_API_KEY reachable on whichever
// path it does not override, and this file exists specifically to keep that key out of
// the test run. Vitest hoists `vi.mock` above the imports below, so `env` here is
// already the mock.
vi.mock('$env/dynamic/private', () => ({ env: {} as Record<string, string | undefined> }));

import { env } from '$env/dynamic/private';
import { sendMail } from './mail';

// The ambient type for $env/dynamic/private is generated from whatever keys are
// actually present in this machine's environment at `svelte-kit sync` time, which types
// RESEND_API_KEY and MAIL_FROM as required strings once they exist anywhere - this cast
// is only so the "unset" tests below can clear them, not a claim about their real shape.
const mutableEnv = env as Record<string, string | undefined>;

describe('sendMail', () => {
	beforeEach(() => {
		mutableEnv.RESEND_API_KEY = 'test-key';
		mutableEnv.MAIL_FROM = 'Canonry <noreply@canonry.io>';
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('refuses to send without RESEND_API_KEY, rather than silently doing nothing', async () => {
		mutableEnv.RESEND_API_KEY = undefined;

		await expect(
			sendMail({ to: 'gm@example.com', subject: 'hi', html: '<p>hi</p>', text: 'hi' })
		).rejects.toThrow('RESEND_API_KEY');
	});

	it('refuses to send without MAIL_FROM', async () => {
		mutableEnv.MAIL_FROM = undefined;

		await expect(
			sendMail({ to: 'gm@example.com', subject: 'hi', html: '<p>hi</p>', text: 'hi' })
		).rejects.toThrow('MAIL_FROM');
	});

	it('posts the message to Resend and returns its id', async () => {
		let capturedUrl = '';
		let capturedInit: RequestInit = {};
		const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
			capturedUrl = url;
			capturedInit = init;
			return new Response(JSON.stringify({ id: 'resend-id-1' }), { status: 200 });
		});
		vi.stubGlobal('fetch', fetchMock);

		const result = await sendMail({
			to: 'gm@example.com',
			subject: 'Confirm',
			html: '<p>confirm</p>',
			text: 'confirm'
		});

		expect(result).toEqual({ id: 'resend-id-1' });
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(capturedUrl).toBe('https://api.resend.com/emails');
		expect(capturedInit.headers).toMatchObject({ authorization: 'Bearer test-key' });
		expect(JSON.parse(capturedInit.body as string)).toEqual({
			from: 'Canonry <noreply@canonry.io>',
			to: 'gm@example.com',
			subject: 'Confirm',
			html: '<p>confirm</p>',
			text: 'confirm'
		});
	});

	it('turns a non-ok response into a thrown error rather than a silent failure', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('nope', { status: 422, statusText: 'Unprocessable' }))
		);

		await expect(
			sendMail({ to: 'gm@example.com', subject: 'hi', html: '<p>hi</p>', text: 'hi' })
		).rejects.toThrow('422');
	});
});

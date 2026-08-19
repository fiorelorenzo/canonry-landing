import { describe, expect, it, vi } from 'vitest';
import type { Sql } from 'postgres';
import type { MailMessage } from './resend';
import {
	applyRunFilters,
	exclusionFor,
	runLaunchNotification,
	type LaunchCandidate
} from './launch-notify';

const ORIGIN = 'https://canonry.io';

function candidate(overrides: Partial<LaunchCandidate> = {}): LaunchCandidate {
	return {
		id: `signup-${overrides.email ?? 'a'}`,
		email: 'gm@canonry.invalid',
		confirm_token: '11111111-2222-4333-8444-555555555555',
		consent_locale: 'unknown',
		consent_confirmed_at: new Date('2026-01-01T00:00:00Z'),
		...overrides
	};
}

/**
 * A fake of every tagged-template call `runLaunchNotification` makes, so no test here opens a
 * connection. Which statement is which is decided by its text, the way the real database would
 * decide by its shape: the point of the fake is to let a test say "the claim came back empty"
 * or "the candidate list is these three rows" and then assert on what the runner did about it.
 */
function fakeSql(options: { candidates?: LaunchCandidate[]; unclaimable?: string[] } = {}) {
	const calls: { text: string; values: unknown[] }[] = [];
	const fn = async (strings: TemplateStringsArray, ...values: unknown[]) => {
		const text = strings.join('?').replace(/\s+/g, ' ').trim();
		calls.push({ text, values });

		if (text.includes('insert into launch_notification_run')) return [{ id: 'run-1' }];
		if (text.includes('from waitlist_signup')) return options.candidates ?? [];
		if (text.includes('set launch_notified_at = now()')) {
			const id = values[0] as string;
			return options.unclaimable?.includes(id) ? [] : [{ id }];
		}
		return [];
	};
	const find = (needle: string) => calls.filter((call) => call.text.includes(needle));
	return { sql: fn as unknown as Sql, calls, find };
}

function fakeTransport() {
	const sent: MailMessage[] = [];
	const transport = vi.fn(async (message: MailMessage) => {
		sent.push(message);
		return { id: `resend-${sent.length}` };
	});
	return { transport, sent };
}

describe('exclusionFor', () => {
	it('excludes a row whose address is not address-shaped', () => {
		expect(exclusionFor(candidate({ email: 'not-an-address' }))).toBe('address_not_mailable');
	});

	it('excludes a row that never confirmed, because that consent cannot be shown', () => {
		expect(exclusionFor(candidate({ consent_confirmed_at: null }))).toBe('consent_not_confirmed');
	});

	it('excludes nothing else', () => {
		expect(exclusionFor(candidate())).toBeNull();
	});
});

describe('applyRunFilters', () => {
	const rows = [
		candidate({ email: 'a@canonry.invalid' }),
		candidate({ email: 'b@example.com' }),
		candidate({ email: 'c@canonry.invalid' })
	];

	it('keeps every row when no filter is given', () => {
		expect(applyRunFilters(rows, {})).toHaveLength(3);
	});

	it('keeps only the given domain, matched on the whole domain and not a suffix', () => {
		expect(applyRunFilters(rows, { onlyDomain: 'canonry.invalid' }).map((r) => r.email)).toEqual([
			'a@canonry.invalid',
			'c@canonry.invalid'
		]);
		expect(applyRunFilters(rows, { onlyDomain: 'nonry.invalid' })).toEqual([]);
	});

	it('takes the first n rows, in the order the query returned them', () => {
		expect(applyRunFilters(rows, { limit: 2 }).map((r) => r.email)).toEqual([
			'a@canonry.invalid',
			'b@example.com'
		]);
	});
});

describe('runLaunchNotification', () => {
	it('selects only launch-only rows that are neither notified nor excluded', async () => {
		const db = fakeSql();

		await runLaunchNotification(db.sql, fakeTransport().transport, {
			mode: 'plan',
			origin: ORIGIN
		});

		const [select] = db.find('from waitlist_signup');
		expect(select.text).toContain("consent_scope = 'launch_only'");
		expect(select.text).toContain('launch_notified_at is null');
		expect(select.text).toContain('launch_notify_excluded_reason is null');
	});

	it('records a run even when it selects nothing, so an empty run is not just a memory', async () => {
		const db = fakeSql({ candidates: [] });

		const summary = await runLaunchNotification(db.sql, fakeTransport().transport, {
			mode: 'send',
			origin: ORIGIN
		});

		expect(summary).toMatchObject({ runId: 'run-1', candidates: 0, sent: 0, skipped: 0 });
		expect(db.find('update launch_notification_run')).toHaveLength(1);
	});

	it('records what narrowed a run, so a partial run is not mistaken for the whole list', async () => {
		const db = fakeSql({ candidates: [] });

		await runLaunchNotification(db.sql, fakeTransport().transport, {
			mode: 'plan',
			origin: ORIGIN,
			onlyDomain: 'canonry.invalid',
			limit: 1
		});

		const [start] = db.find('insert into launch_notification_run');
		expect(start.values).toEqual(['plan', ORIGIN, 'canonry.invalid', 1]);
	});

	it('plans without claiming, sending or excluding anything', async () => {
		const db = fakeSql({
			candidates: [candidate({ email: 'a@canonry.invalid' }), candidate({ email: 'bad-address' })]
		});
		const mail = fakeTransport();

		const summary = await runLaunchNotification(db.sql, mail.transport, {
			mode: 'plan',
			origin: ORIGIN
		});

		expect(summary).toMatchObject({ candidates: 2, planned: 1, sent: 0, skipped: 1 });
		expect(summary.reasons).toEqual({ address_not_mailable: 1 });
		expect(mail.transport).not.toHaveBeenCalled();
		expect(db.find('set launch_notified_at = now()')).toHaveLength(0);
		expect(db.find('set launch_notify_excluded_reason')).toHaveLength(0);
	});

	it('claims the row before the mail leaves, and only a row nobody has claimed', async () => {
		const row = candidate({ email: 'a@canonry.invalid' });
		const db = fakeSql({ candidates: [row] });

		await runLaunchNotification(db.sql, fakeTransport().transport, {
			mode: 'send',
			origin: ORIGIN
		});

		const [claim] = db.find('set launch_notified_at = now()');
		expect(claim.values).toEqual([row.id]);
		expect(claim.text).toContain('launch_notified_at is null');
		expect(claim.text).toContain("consent_scope = 'launch_only'");
		// The claim is written first: a second run cannot select the row again, and cannot send
		// a second copy even if it did.
		expect(db.calls.indexOf(claim)).toBeLessThan(
			db.calls.findIndex((call) => call.text.includes('insert into launch_notification_attempt'))
		);
	});

	it('sends one mail per claimed row and records the provider id against it', async () => {
		const rows = [
			candidate({ email: 'a@canonry.invalid', id: 'signup-a' }),
			candidate({ email: 'b@canonry.invalid', id: 'signup-b' })
		];
		const db = fakeSql({ candidates: rows });
		const mail = fakeTransport();

		const summary = await runLaunchNotification(db.sql, mail.transport, {
			mode: 'send',
			origin: ORIGIN
		});

		expect(summary).toMatchObject({ candidates: 2, sent: 2, failed: 0, skipped: 0 });
		expect(mail.sent.map((message) => message.to)).toEqual([
			'a@canonry.invalid',
			'b@canonry.invalid'
		]);
		const attempts = db.find('insert into launch_notification_attempt');
		expect(attempts).toHaveLength(2);
		expect(attempts[0].values).toEqual(['run-1', 'signup-a', 'en', 'sent', null, 'resend-1']);
	});

	it('skips a row another run claimed first rather than sending it twice', async () => {
		const rows = [
			candidate({ email: 'a@canonry.invalid', id: 'signup-a' }),
			candidate({ email: 'b@canonry.invalid', id: 'signup-b' })
		];
		const db = fakeSql({ candidates: rows, unclaimable: ['signup-a'] });
		const mail = fakeTransport();

		const summary = await runLaunchNotification(db.sql, mail.transport, {
			mode: 'send',
			origin: ORIGIN
		});

		expect(summary).toMatchObject({ sent: 1, skipped: 1 });
		expect(summary.reasons).toEqual({ claimed_by_another_run: 1 });
		expect(mail.sent.map((message) => message.to)).toEqual(['b@canonry.invalid']);
	});

	it('writes the exclusion to the row on a real run, and never mails an excluded row', async () => {
		const db = fakeSql({
			candidates: [
				candidate({ email: 'bad-address', id: 'signup-bad' }),
				candidate({ email: 'c@canonry.invalid', consent_confirmed_at: null, id: 'signup-c' })
			]
		});
		const mail = fakeTransport();

		const summary = await runLaunchNotification(db.sql, mail.transport, {
			mode: 'send',
			origin: ORIGIN
		});

		expect(summary).toMatchObject({ candidates: 2, sent: 0, skipped: 2 });
		expect(summary.reasons).toEqual({ address_not_mailable: 1, consent_not_confirmed: 1 });
		expect(mail.transport).not.toHaveBeenCalled();
		expect(db.find('set launch_notify_excluded_reason').map((call) => call.values)).toEqual([
			['address_not_mailable', 'signup-bad'],
			['consent_not_confirmed', 'signup-c']
		]);
	});

	it('picks each row language from its own consent_locale, falling back to English', async () => {
		const db = fakeSql({
			candidates: [
				candidate({ email: 'it@canonry.invalid', consent_locale: 'it' }),
				candidate({ email: 'unknown@canonry.invalid', consent_locale: 'unknown' })
			]
		});
		const mail = fakeTransport();

		await runLaunchNotification(db.sql, mail.transport, { mode: 'send', origin: ORIGIN });

		expect(mail.sent[0].subject).toBe('Canonry è online');
		expect(mail.sent[0].text).toContain('/it/newsletter/');
		expect(mail.sent[1].subject).toBe('Canonry is live');
	});

	it('refuses to rehearse against an address that is not on a .invalid domain', async () => {
		const db = fakeSql({
			candidates: [
				candidate({ email: 'a@canonry.invalid' }),
				candidate({ email: 'real.person@example.com' })
			]
		});
		const mail = fakeTransport();

		await expect(
			runLaunchNotification(db.sql, mail.transport, { mode: 'rehearse', origin: ORIGIN })
		).rejects.toThrow('not on a .invalid domain');
		expect(mail.transport).not.toHaveBeenCalled();
		expect(db.find('set launch_notified_at = now()')).toHaveLength(0);
		// Even a refused run leaves its reason behind rather than only a non-zero exit code.
		const [finish] = db.find('update launch_notification_run');
		expect(finish.values.at(-2)).toContain('not on a .invalid domain');
	});

	it('keeps the claim on a failed send, so nothing is retried behind my back', async () => {
		const db = fakeSql({ candidates: [candidate({ email: 'a@canonry.invalid', id: 'signup-a' })] });
		const transport = vi.fn(async () => {
			throw new Error('Resend rejected the send: 422 Unprocessable');
		});

		const summary = await runLaunchNotification(db.sql, transport, {
			mode: 'send',
			origin: ORIGIN
		});

		expect(summary).toMatchObject({ sent: 0, failed: 1 });
		const [attempt] = db.find('insert into launch_notification_attempt');
		expect(attempt.values).toEqual([
			'run-1',
			'signup-a',
			'en',
			'failed',
			'Resend rejected the send: 422 Unprocessable',
			null
		]);
		expect(db.calls.some((call) => call.text.includes('set launch_notified_at = null'))).toBe(
			false
		);
	});

	it('stops once the failures look like a broken transport rather than a bad address', async () => {
		const db = fakeSql({
			candidates: [
				candidate({ email: 'a@canonry.invalid', id: 'signup-a' }),
				candidate({ email: 'b@canonry.invalid', id: 'signup-b' }),
				candidate({ email: 'c@canonry.invalid', id: 'signup-c' })
			]
		});
		const transport = vi.fn(async () => {
			throw new Error('Resend rejected the send: 401 Unauthorized');
		});

		await expect(
			runLaunchNotification(db.sql, transport, { mode: 'send', origin: ORIGIN, maxFailures: 2 })
		).rejects.toThrow('stopping after 2 failed sends');
		expect(transport).toHaveBeenCalledTimes(2);
	});
});

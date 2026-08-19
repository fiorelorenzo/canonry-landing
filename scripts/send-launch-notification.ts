#!/usr/bin/env node
/// <reference types="node" />
/**
 * Sends the launch notification (issue #14). One irreversible send to real people, so this
 * script is deliberately not a one-command affair: it does nothing but plan unless told
 * otherwise, and the telling is explicit.
 *
 *   --mode=plan       (default) selects and classifies, sends nothing, records the run
 *   --mode=rehearse   sends through a transport that prints and never reaches the network,
 *                     and refuses to run at all unless every selected address is on a
 *                     .invalid domain
 *   --mode=send       the real thing, through Resend. Requires --confirm, RESEND_API_KEY,
 *                     MAIL_FROM, and an https origin
 *
 *   --only-domain=example.com   send only to addresses on that domain
 *   --limit=1                   send to at most that many, oldest signup first
 *   --origin=https://canonry.io the origin every link in the mail is built from
 *                               (default: $ORIGIN, then https://canonry.io)
 *   --max-failures=3            give up after this many failed sends
 *
 * Usage, with the environment coming from the app's own .env:
 *   node --env-file=.env scripts/send-launch-notification.ts --mode=plan
 *   node --env-file=.env scripts/send-launch-notification.ts --mode=send --confirm
 *
 * This is a plain node script, run through node's own type stripping rather than Vite, which
 * is why the modules it imports use relative paths with explicit extensions and never touch
 * `$env/dynamic/private`: the transport is built here, from process.env, and handed to
 * `runLaunchNotification`, which holds every rule about who gets the mail and how often.
 */
import { parseArgs } from 'node:util';
import postgres from 'postgres';
import { runLaunchNotification, type LaunchNotifyMode } from '../src/lib/server/launch-notify.ts';
import { resendTransport, type MailTransport } from '../src/lib/server/resend.ts';

const MODES: LaunchNotifyMode[] = ['plan', 'rehearse', 'send'];

const { values } = parseArgs({
	options: {
		mode: { type: 'string', default: 'plan' },
		confirm: { type: 'boolean', default: false },
		'only-domain': { type: 'string' },
		limit: { type: 'string' },
		origin: { type: 'string' },
		'max-failures': { type: 'string' }
	}
});

function fail(message: string): never {
	console.error(message);
	process.exit(1);
}

const mode = values.mode as LaunchNotifyMode;
if (!MODES.includes(mode)) {
	fail(`--mode must be one of ${MODES.join(', ')}, not ${values.mode}`);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	fail('DATABASE_URL is not set, so there is nothing to read the list from');
}

const origin = values.origin ?? process.env.ORIGIN ?? 'https://canonry.io';
const limit = values.limit === undefined ? undefined : Number(values.limit);
if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
	fail(`--limit must be a positive whole number, not ${values.limit}`);
}
const maxFailures =
	values['max-failures'] === undefined ? undefined : Number(values['max-failures']);
if (maxFailures !== undefined && (!Number.isInteger(maxFailures) || maxFailures < 1)) {
	fail(`--max-failures must be a positive whole number, not ${values['max-failures']}`);
}

let transport: MailTransport;
if (mode === 'plan') {
	// Never called: runLaunchNotification records a plan without sending. Throwing rather than
	// returning a fake result means a bug that reaches the send path in plan mode fails loudly.
	transport = () => {
		throw new Error('plan mode does not send');
	};
} else if (mode === 'rehearse') {
	let n = 0;
	transport = async (message) => {
		n += 1;
		console.log(`\n--- rehearsal ${n}: ${message.to}`);
		console.log(`subject: ${message.subject}`);
		console.log(message.text);
		return { id: `rehearsal-${n}` };
	};
} else {
	if (!values.confirm) {
		fail('--mode=send needs --confirm too. Run --mode=plan first and read what it selected.');
	}
	if (!process.env.RESEND_API_KEY) fail('RESEND_API_KEY is not set, so there is no way to send');
	if (!process.env.MAIL_FROM) fail('MAIL_FROM is not set, so there is no from header to send with');
	if (!origin.startsWith('https://')) {
		fail(`refusing to put ${origin} links in real mail: --origin must be an https URL`);
	}
	transport = resendTransport({
		apiKey: process.env.RESEND_API_KEY,
		from: process.env.MAIL_FROM
	});
	console.log(`sending for real, from ${process.env.MAIL_FROM}, links pointing at ${origin}`);
}

const client = postgres(databaseUrl, { max: 1 });

try {
	const summary = await runLaunchNotification(client, transport, {
		mode,
		origin,
		onlyDomain: values['only-domain'],
		limit,
		maxFailures
	});
	console.log(`\n${JSON.stringify(summary, null, 2)}`);
	console.log(
		`\nrecorded as launch_notification_run ${summary.runId}. What each row ended up as:` +
			`\n  select launch_notified_at, launch_notify_excluded_reason, count(*)` +
			`\n  from waitlist_signup where consent_scope = 'launch_only'` +
			`\n  group by 1, 2;`
	);
} catch (error) {
	// The run recorded its own failure before rethrowing, so the message is the pointer, not
	// the record: launch_notification_run holds what happened and how far it got.
	console.error(`\n${error instanceof Error ? error.message : String(error)}`);
	process.exitCode = 1;
} finally {
	await client.end();
}

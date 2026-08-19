#!/usr/bin/env node
/// <reference types="node" />
/**
 * Prints the launch notification (issue #14) in full, in both languages, so it can be read
 * as a reader will read it rather than reconstructed from a template. This is what goes in
 * the pull request for review, and it needs no database and no key.
 *
 *   node scripts/render-launch-email.ts
 *   node scripts/render-launch-email.ts --html --origin=http://127.0.0.1:5195
 *
 * The token is a placeholder by default: a real one is a row's own `confirm_token` and only
 * ever appears in that row's own mail.
 */
import { parseArgs } from 'node:util';
import { renderLaunchEmail } from '../src/lib/server/launch-email.ts';
import type { Locale } from '../src/lib/i18n.ts';

const { values } = parseArgs({
	options: {
		origin: { type: 'string', default: 'https://canonry.io' },
		token: { type: 'string', default: '00000000-0000-4000-8000-000000000000' },
		html: { type: 'boolean', default: false }
	}
});

const locales: Locale[] = ['en', 'it'];

for (const locale of locales) {
	const mail = renderLaunchEmail({ token: values.token, locale, origin: values.origin });
	console.log(`===== ${locale} =====`);
	console.log(`Subject: ${mail.subject}`);
	console.log('');
	console.log(values.html ? mail.html : mail.text);
	console.log('');
}

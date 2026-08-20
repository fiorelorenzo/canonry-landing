#!/usr/bin/env node
/**
 * Requests every canonry.io URL this site's source links to, and fails on anything that is
 * not 2xx.
 *
 * Issue #15: the door page points at `app.canonry.io/p/valdoria-reach`, a world published on
 * the prod stack rather than anything this repository builds, so nothing here can prove that
 * link works and no unit test ever will. #13 handled that by checking it by hand and then
 * refusing to ship the link at all when it answered 404, which is the right call made in the
 * only way available at the time. This is that check, automated: the link cannot ship broken,
 * and it cannot rot later without a red build saying so.
 *
 * Deliberately not part of `pnpm test`: that suite touches no network (see AGENTS.md) and
 * keeping it that way means a plane, a train or a down prod stack never blocks a unit run.
 * CI runs this as its own step, where a failure reads as "the thing we point at is down"
 * rather than as a broken test.
 *
 * Usage: node scripts/check-external-links.mjs
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const SRC = path.join(import.meta.dirname, '..', 'src');
/** `src/lib/app.ts` exists precisely because every cross-origin URL this site links lives
 * there, so that is where they are read from. Plus any absolute `href` typed straight into a
 * component, which is the other way one can reach a page. Deliberately not a scan of all of
 * `src`: a URL inside a comment or a test expectation is not a link this site shows, and
 * treating one as a link is how a check like this starts failing for the wrong reason. */
const APP_URLS = path.join(SRC, 'lib', 'app.ts');
const URL_PATTERN = /https:\/\/(?:app\.)?canonry\.io[^\s"'`<>)]*/g;
const HREF_PATTERN = /href="(https:\/\/[^"]+)"/g;
const ATTEMPTS = 3;
const TIMEOUT_MS = 15_000;

async function svelteFiles(dir) {
	const found = [];
	for (const item of await readdir(dir, { withFileTypes: true })) {
		const full = path.join(dir, item.name);
		if (item.isDirectory()) found.push(...(await svelteFiles(full)));
		else if (item.name.endsWith('.svelte')) found.push(full);
	}
	return found;
}

/** Every distinct URL, each with the files that link it, so a failure names where to look. */
async function collect() {
	const byUrl = new Map();
	const add = (url, file) => {
		const where = byUrl.get(url) ?? [];
		where.push(path.relative(SRC, file));
		byUrl.set(url, where);
	};

	for (const match of (await readFile(APP_URLS, 'utf8')).matchAll(URL_PATTERN)) {
		add(match[0], APP_URLS);
	}
	for (const file of await svelteFiles(SRC)) {
		for (const match of (await readFile(file, 'utf8')).matchAll(HREF_PATTERN)) {
			if (match[1].startsWith('mailto:')) continue;
			add(match[1], file);
		}
	}
	return byUrl;
}

/** GET rather than HEAD: adapter-node answers HEAD, but a CDN or a proxy in front of one of
 * these origins does not have to, and a 405 here would be a false failure. */
async function status(url) {
	let last = 'no attempt';
	for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
		try {
			const res = await fetch(url, {
				redirect: 'follow',
				signal: AbortSignal.timeout(TIMEOUT_MS),
				headers: { 'user-agent': 'canonry-landing-link-check' }
			});
			if (res.ok) return { ok: true, detail: String(res.status) };
			last = String(res.status);
		} catch (err) {
			last = err instanceof Error ? err.message : String(err);
		}
		if (attempt < ATTEMPTS) await new Promise((r) => setTimeout(r, 2000 * attempt));
	}
	return { ok: false, detail: last };
}

const byUrl = await collect();
if (byUrl.size === 0) {
	console.error(
		'found no canonry.io URLs in src/, which means this check is not checking anything'
	);
	process.exit(1);
}

const failed = [];
for (const [url, where] of [...byUrl].sort()) {
	const result = await status(url);
	console.log(`${result.ok ? 'ok  ' : 'FAIL'} ${result.detail.padEnd(6)} ${url}`);
	if (!result.ok) failed.push({ url, where, detail: result.detail });
}

if (failed.length > 0) {
	console.error('');
	for (const f of failed) {
		console.error(`${f.url} answered ${f.detail}, linked from: ${f.where.join(', ')}`);
	}
	console.error('');
	console.error('A link on this page is broken. Fix the target or take the link out;');
	console.error('shipping it is worse than not having it (issues #13 and #15).');
	process.exit(1);
}

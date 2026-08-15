import { describe, expect, it } from 'vitest';
import { localeFromPathname } from './i18n';

describe('localeFromPathname', () => {
	it('treats the bare /it path as Italian', () => {
		expect(localeFromPathname('/it')).toBe('it');
	});

	it('treats anything nested under /it/ as Italian', () => {
		expect(localeFromPathname('/it/pricing')).toBe('it');
	});

	it('treats the root and everything else as English', () => {
		expect(localeFromPathname('/')).toBe('en');
		expect(localeFromPathname('/pricing')).toBe('en');
		expect(localeFromPathname('/docs/export')).toBe('en');
	});

	it('does not match a path that merely starts with "it" as a word', () => {
		expect(localeFromPathname('/italy')).toBe('en');
		expect(localeFromPathname('/items')).toBe('en');
	});
});

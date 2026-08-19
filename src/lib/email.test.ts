import { describe, expect, it } from 'vitest';
import { normalizeEmail } from './email';

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

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./mail', () => ({ sendMail: vi.fn() }));

import { sendMail } from './mail';
import { sendConfirmationEmail } from './confirmation-email';

describe('sendConfirmationEmail', () => {
	beforeEach(() => {
		vi.mocked(sendMail).mockReset();
	});

	it('builds the confirm link from the origin and token, in English', async () => {
		vi.mocked(sendMail).mockResolvedValue({ id: 'resend-id' });

		await sendConfirmationEmail({
			to: 'gm@example.com',
			token: 'abc-123',
			locale: 'en',
			origin: 'https://canonry.io'
		});

		expect(sendMail).toHaveBeenCalledTimes(1);
		const call = vi.mocked(sendMail).mock.calls[0][0];
		expect(call.to).toBe('gm@example.com');
		expect(call.subject).toBe('Confirm your Canonry newsletter subscription');
		expect(call.text).toContain('https://canonry.io/confirm/abc-123');
		expect(call.html).toContain('https://canonry.io/confirm/abc-123');
	});

	it('renders Italian copy for the it locale', async () => {
		vi.mocked(sendMail).mockResolvedValue({ id: 'resend-id' });

		await sendConfirmationEmail({
			to: 'gm@example.com',
			token: 'abc-123',
			locale: 'it',
			origin: 'https://canonry.io'
		});

		const call = vi.mocked(sendMail).mock.calls[0][0];
		expect(call.subject).toBe('Conferma la tua iscrizione alla newsletter di Canonry');
		expect(call.text).toContain('https://canonry.io/confirm/abc-123');
	});

	it('propagates a transport failure rather than swallowing it', async () => {
		vi.mocked(sendMail).mockRejectedValue(new Error('resend down'));

		await expect(
			sendConfirmationEmail({
				to: 'gm@example.com',
				token: 'abc-123',
				locale: 'en',
				origin: 'https://canonry.io'
			})
		).rejects.toThrow('resend down');
	});
});

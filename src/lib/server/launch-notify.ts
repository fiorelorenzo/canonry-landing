/**
 * The launch notification's one run (issue #14). Everything irreversible about this feature
 * is in this file, so the rules it enforces are stated here rather than left to whoever runs
 * it:
 *
 * 1. Only `launch_only` rows are ever selected. The `newsletter` rows the form writes today
 *    (M1, canonry repository docs/ux/DECISIONS.md round eight) never asked to be told about
 *    a launch, and the whole point of that decision is that nobody's consent gets widened
 *    after the fact - in either direction.
 * 2. A row is claimed before its mail leaves, with an UPDATE that only matches a row whose
 *    `launch_notified_at` is still null. A row that comes back unclaimed belonged to another
 *    run, so this one skips it rather than sending a second copy. The partial unique index in
 *    migrations/0003_launch_notification.sql then makes a second delivery record impossible
 *    even if this loop were bypassed entirely.
 * 3. A row that cannot honestly be sent the mail is excluded with a reason, written to the
 *    row, terminal until somebody clears it by hand. Being skipped silently is not an option:
 *    the acceptance for this issue is that every `launch_only` row ends up either notified
 *    once or excluded for a stated reason.
 * 4. Every run records itself, including the ones that select nothing, so "I ran it and it
 *    did nothing" is a row in `launch_notification_run` rather than a memory.
 * 5. `rehearse` refuses to run at all if any selected address is not on a `.invalid` domain,
 *    which is what makes it safe to exercise the real send path against seeded rows while
 *    the live Resend key sits in the same `.env`.
 *
 * The transport is a parameter, not an import: `scripts/send-launch-notification.ts` passes
 * the real Resend transport for `send` and a printing one for `rehearse`, and the tests pass
 * a fake. Same reasoning as `subscribe`'s `postgres.Sql` parameter in `$lib/server/waitlist.ts`.
 *
 * Relative imports with explicit extensions, like `./launch-email.ts`: this module also runs
 * outside SvelteKit, under node's own type stripping, where `$lib/...` does not resolve.
 */
import type postgres from 'postgres';
import type { Locale } from '$lib/i18n';
import { normalizeEmail } from '../email.ts';
import { renderLaunchEmail } from './launch-email.ts';
import type { MailTransport } from './resend.ts';

export type LaunchNotifyMode = 'plan' | 'rehearse' | 'send';

/** Why a row will never be sent the launch notification. Written to
 * `waitlist_signup.launch_notify_excluded_reason`, one row at a time, by a real run. */
export type ExclusionReason = 'address_not_mailable' | 'consent_not_confirmed';

/** Why an attempt produced nothing. The exclusions above, plus the one case that is nobody's
 * fault and not terminal: another run already claimed the row. */
export type SkipReason = ExclusionReason | 'claimed_by_another_run';

export interface LaunchCandidate {
	id: string;
	email: string;
	confirm_token: string;
	consent_locale: string;
	consent_confirmed_at: Date | null;
}

export interface LaunchNotifyOptions {
	mode: LaunchNotifyMode;
	/** This site's public origin, used for every link in the mail. */
	origin: string;
	/** Send only to addresses on this domain, so a first real run can be one address on a
	 * domain I own. Run-scoped: it is recorded on the run and never written to a row, because
	 * "not selected this time" is not an exclusion. */
	onlyDomain?: string;
	/** Stop after this many candidates, in `created_at` order. Same reasoning as `onlyDomain`. */
	limit?: number;
	/** Give up after this many failed sends rather than working through the whole list against
	 * a transport that is evidently broken. A single rejected address should not stop the run,
	 * a broken key should. */
	maxFailures?: number;
}

export interface LaunchNotifySummary {
	runId: string;
	mode: LaunchNotifyMode;
	candidates: number;
	planned: number;
	sent: number;
	failed: number;
	skipped: number;
	/** How many rows each skip or exclusion reason accounts for. */
	reasons: Record<string, number>;
}

/** The row-shaped half of the decision, pure so its own test does not need a database. Null
 * means the row can be sent the mail. */
export function exclusionFor(row: LaunchCandidate): ExclusionReason | null {
	// Rows that predate this repository owning the table (0001's own comment: it used to be
	// migration 0019 in the product monorepo) went in before any of today's validation, so an
	// address that cannot be normalized is a real possibility rather than a defensive branch.
	if (!normalizeEmail(row.email)) return 'address_not_mailable';
	// Every launch-only row that came through the old form was backfilled as confirmed by
	// migration 0002, because a single-opt-in submission was the whole of consent at the time.
	// A launch-only row with no confirmation is therefore not a normal signup at all, and an
	// unproven consent is not something to resolve in favour of sending.
	if (!row.consent_confirmed_at) return 'consent_not_confirmed';
	return null;
}

/** The run-scoped filters, applied after the query rather than inside it so that "candidates"
 * means the rows this run actually considered, and so the SQL stays one static statement. */
export function applyRunFilters(
	rows: readonly LaunchCandidate[],
	options: Pick<LaunchNotifyOptions, 'onlyDomain' | 'limit'>
): LaunchCandidate[] {
	const domain = options.onlyDomain?.toLowerCase();
	const filtered = domain
		? rows.filter((row) => row.email.toLowerCase().endsWith(`@${domain}`))
		: [...rows];
	return options.limit === undefined ? filtered : filtered.slice(0, options.limit);
}

export async function runLaunchNotification(
	client: postgres.Sql,
	transport: MailTransport,
	options: LaunchNotifyOptions
): Promise<LaunchNotifySummary> {
	const runRows = await client<{ id: string }[]>`
		insert into launch_notification_run (mode, origin, only_domain, row_limit)
		values (${options.mode}, ${options.origin}, ${options.onlyDomain ?? null}, ${options.limit ?? null})
		returning id
	`;
	const runId = runRows[0].id;

	const summary: LaunchNotifySummary = {
		runId,
		mode: options.mode,
		candidates: 0,
		planned: 0,
		sent: 0,
		failed: 0,
		skipped: 0,
		reasons: {}
	};
	let failure: Error | null = null;

	const record = (
		signupId: string,
		locale: Locale,
		outcome: 'planned' | 'sent' | 'failed' | 'skipped',
		reason: string | null,
		providerMessageId: string | null
	) => client`
		insert into launch_notification_attempt (run_id, signup_id, locale, outcome, reason, provider_message_id)
		values (${runId}, ${signupId}, ${locale}, ${outcome}, ${reason}, ${providerMessageId})
	`;

	const countReason = (reason: SkipReason | string) => {
		summary.reasons[reason] = (summary.reasons[reason] ?? 0) + 1;
	};

	try {
		const rows = await client<LaunchCandidate[]>`
			select id, email, confirm_token, consent_locale, consent_confirmed_at
			from waitlist_signup
			where consent_scope = 'launch_only'
				and launch_notified_at is null
				and launch_notify_excluded_reason is null
			order by created_at, id
		`;
		const candidates = applyRunFilters(rows, options);
		summary.candidates = candidates.length;

		if (options.mode === 'rehearse') {
			// Only the rows that would actually be mailed: an excluded row gets no mail in any
			// mode, so a malformed address in the table is not a reason to refuse a rehearsal.
			const mailable = candidates.filter((row) => exclusionFor(row) === null);
			const live = mailable.filter((row) => !/\.invalid$/i.test(row.email.trim()));
			if (live.length > 0) {
				throw new Error(
					`rehearse refuses to send: ${live.length} of ${mailable.length} mailable addresses are not on a .invalid domain`
				);
			}
		}

		const maxFailures = options.maxFailures ?? 3;

		for (const row of candidates) {
			// 'en', 'it', or 0002's 'unknown' backfill, which is what every pre-M1 row carries
			// because the table never recorded a language. English is the honest fallback there,
			// the same choice `$lib/server/confirm.ts` makes for the same column.
			const locale: Locale = row.consent_locale === 'it' ? 'it' : 'en';

			const exclusion = exclusionFor(row);
			if (exclusion) {
				// A plan writes nothing to the row: it reports what a real run would exclude, and
				// an exclusion is a decision the real run gets to make.
				if (options.mode !== 'plan') {
					await client`
						update waitlist_signup
						set launch_notify_excluded_reason = ${exclusion}
						where id = ${row.id} and launch_notify_excluded_reason is null
					`;
				}
				await record(row.id, locale, 'skipped', exclusion, null);
				summary.skipped += 1;
				countReason(exclusion);
				continue;
			}

			if (options.mode === 'plan') {
				await record(row.id, locale, 'planned', null, null);
				summary.planned += 1;
				continue;
			}

			const claimed = await client<{ id: string }[]>`
				update waitlist_signup
				set launch_notified_at = now()
				where id = ${row.id}
					and consent_scope = 'launch_only'
					and launch_notified_at is null
				returning id
			`;
			if (claimed.length === 0) {
				await record(row.id, locale, 'skipped', 'claimed_by_another_run', null);
				summary.skipped += 1;
				countReason('claimed_by_another_run');
				continue;
			}

			const mail = renderLaunchEmail({ token: row.confirm_token, locale, origin: options.origin });
			try {
				const result = await transport({
					to: normalizeEmail(row.email) ?? row.email,
					subject: mail.subject,
					text: mail.text,
					html: mail.html
				});
				await record(row.id, locale, 'sent', null, result.id);
				summary.sent += 1;
			} catch (error) {
				// The claim stays. A failure here is either "Resend said no" or "we do not know
				// whether it went out", and the second one is indistinguishable from the first at
				// this level, so no row is ever automatically retried: the attempt row says which
				// one failed and a human decides.
				const reason = error instanceof Error ? error.message : String(error);
				await record(row.id, locale, 'failed', reason, null);
				summary.failed += 1;
				countReason('send_failed');
				if (summary.failed >= maxFailures) {
					throw new Error(`stopping after ${summary.failed} failed sends: ${reason}`, {
						cause: error
					});
				}
			}
		}
	} catch (error) {
		failure = error instanceof Error ? error : new Error(String(error));
	} finally {
		await client`
			update launch_notification_run
			set finished_at = now(),
				candidates = ${summary.candidates},
				planned = ${summary.planned},
				sent = ${summary.sent},
				failed = ${summary.failed},
				skipped = ${summary.skipped},
				error = ${failure?.message ?? null}
			where id = ${runId}
		`;
	}

	if (failure) {
		throw new Error(`launch notification run ${runId} stopped: ${failure.message}`, {
			cause: failure
		});
	}
	return summary;
}

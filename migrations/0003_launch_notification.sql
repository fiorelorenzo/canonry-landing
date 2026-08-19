-- Issue #14: the addresses collected under the old promise - one email, when Canonry
-- launched - still have not been told, and M1 (canonry repository, docs/ux/DECISIONS.md,
-- round eight) says we either tell them or leave them alone rather than quietly
-- reinterpreting them into a wider list. Telling them is one irreversible send to real
-- people, so the whole job of this migration is to make a second send impossible and the
-- first one checkable afterwards.
--
-- Two columns on the row that already exists:
--   launch_notified_at             null until the row has been claimed for its one send.
--                                  $lib/server/launch-notify.ts sets it in the claiming
--                                  UPDATE, before the mail leaves, never after: a claim
--                                  written first can at worst cost somebody an email they
--                                  were owed, while a claim written after a successful
--                                  send costs somebody a second copy of it, and a
--                                  duplicate in a stranger's inbox is the worse of the two
--                                  failures.
--   launch_notify_excluded_reason  why this row will never be sent it, when that is the
--                                  honest answer instead. Terminal on purpose: the send
--                                  skips any row carrying one, so clearing it by hand is
--                                  the only way a row re-enters the population.
--
-- Every launch_only row therefore ends in exactly one of three states, and which one is a
-- single query away: notified once (launch_notified_at set), deliberately excluded with a
-- reason, or still owed the mail (both null).
--
-- And two tables for the run itself, because "the run's result" cannot live in a terminal
-- somebody has since closed:
--   launch_notification_run      one row per run, including the plan-only rehearsals and
--                                the runs that select nothing at all, so "I ran it and it
--                                did nothing" is a record rather than a memory.
--   launch_notification_attempt  one row per candidate per run. No email column, on
--                                purpose: the address lives in waitlist_signup and nowhere
--                                else, so the deletion /privacy promises stays one delete
--                                (the cascade below takes the attempt rows with it) rather
--                                than leaving a copy of the address behind in an audit
--                                table nobody thinks to look in. Join for the address
--                                while the row is still there.
--
-- launch_notification_attempt_one_delivery is the row-level guarantee the issue asks for,
-- held by the database rather than by the loop: at most one delivered-or-failed attempt can
-- exist per signup, ever, so a second real send is a constraint violation even if the claim
-- above were somehow bypassed. 'planned' attempts are exempt, because planning is meant to
-- be repeatable, and 'skipped' ones because a row can be skipped by any number of runs.
--
-- Idempotent the way 0001 and 0002 are: every statement is `if not exists`, and both new
-- columns are nullable with no default, so adding them changes no existing row's meaning.

alter table waitlist_signup
	add column if not exists launch_notified_at timestamptz,
	add column if not exists launch_notify_excluded_reason text,
	add column if not exists newsletter_opted_in_at timestamptz;

create table if not exists launch_notification_run (
	id uuid primary key default gen_random_uuid(),
	mode text not null check (mode in ('plan', 'rehearse', 'send')),
	origin text not null,
	only_domain text,
	row_limit integer,
	started_at timestamptz not null default now(),
	finished_at timestamptz,
	candidates integer not null default 0,
	planned integer not null default 0,
	sent integer not null default 0,
	failed integer not null default 0,
	skipped integer not null default 0,
	error text
);

create table if not exists launch_notification_attempt (
	id uuid primary key default gen_random_uuid(),
	run_id uuid not null references launch_notification_run (id) on delete cascade,
	signup_id uuid not null references waitlist_signup (id) on delete cascade,
	locale text not null,
	outcome text not null check (outcome in ('planned', 'sent', 'failed', 'skipped')),
	reason text,
	provider_message_id text,
	created_at timestamptz not null default now()
);

create index if not exists launch_notification_attempt_run_idx
	on launch_notification_attempt (run_id);

create unique index if not exists launch_notification_attempt_one_delivery
	on launch_notification_attempt (signup_id)
	where outcome in ('sent', 'failed');

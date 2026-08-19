-- Issue #8: waitlist_signup records an address and a timestamp and nothing about what
-- the person agreed to. Round eight's decision (canonry repository, docs/ux/DECISIONS.md,
-- M1) settles what closes that gap: double opt-in for everything from here on, and the
-- addresses already collected keep the promise they were collected under - launch-only -
-- rather than being reinterpreted into a wider list now that one exists to widen into.
--
-- Five columns, all of it captured at the moment consent is given because none of it can
-- be reconstructed later:
--   consent_text          the exact sentence WaitlistForm.svelte showed above the button
--                         ($lib/consent.ts's CONSENT_COPY - the one source both the
--                         component and the server read, so they cannot drift)
--   consent_locale        which of the two locales that sentence was shown in
--   consent_scope         what they opted into - 'launch_only' is the only value this
--                         repository writes today; 'newsletter' exists in the check
--                         constraint for the day a second checkbox does, not built here
--   confirm_token          the double opt-in link's secret, minted at signup and looked
--                         up by $lib/server/confirm.ts when somebody follows it
--   consent_confirmed_at  null until they do - "mailable" reads as
--                         consent_confirmed_at is not null, nothing subtler
--
-- Existing rows get an honest backfill, not a guess: consent_text says plainly that the
-- row predates consent tracking, consent_locale is 'unknown' because this table never
-- recorded it, consent_scope is 'launch_only' per M1, and consent_confirmed_at is
-- backfilled to created_at - the old form's single-opt-in submission *was* the whole of
-- consent at the time, so treating that moment as the confirmation moment is a truthful
-- description of a flow that only ever had one step, not an upgrade to a flow it never
-- went through. No row already in this table is asked to confirm again by this migration;
-- a re-permission mail, if one is ever sent, is the other issue M1 names
-- (canonry-landing#9), not this one.
--
-- Idempotent the way 0001 asks for, and it does not need 0001's tracking-table escape
-- hatch even though it does backfill existing rows: every ADD COLUMN below carries the
-- legacy value as a column DEFAULT, so Postgres fills every existing row the moment the
-- column is added, in the same statement - no separate UPDATE that could double-apply.
-- `IF NOT EXISTS` on each column makes re-running the whole file a no-op once the columns
-- exist. The DROP DEFAULT statements after are what keep the placeholder from leaking
-- into new rows: a future insert that forgets consent_text now fails NOT NULL loudly
-- instead of silently being labelled "collected before this table tracked consent", and
-- DROP DEFAULT is itself idempotent (dropping a default that is already gone is not an
-- error, just a no-op). confirm_token's default is left in place on purpose:
-- gen_random_uuid() per row is the right value for a brand new row too, not a legacy
-- placeholder that needs retiring.
--
-- The backfill UPDATE for consent_confirmed_at is guarded the same way, on the one
-- condition that only ever matches a legacy row: consent_confirmed_at still null and
-- consent_text still exactly the placeholder this file writes. A row this migration has
-- already touched no longer matches (its consent_confirmed_at is set), and a row the app
-- writes after this migration never matches (its consent_text is real copy, never the
-- placeholder), so re-running this file touches every legacy row exactly once, ever.

alter table waitlist_signup
	add column if not exists consent_text text not null
		default 'Collected before this table tracked consent; treated as launch-only per docs/ux/DECISIONS.md M1.',
	add column if not exists consent_locale text not null default 'unknown',
	add column if not exists consent_scope text not null default 'launch_only'
		check (consent_scope in ('launch_only', 'newsletter')),
	add column if not exists confirm_token uuid not null default gen_random_uuid(),
	add column if not exists consent_confirmed_at timestamptz;

update waitlist_signup
set consent_confirmed_at = created_at
where consent_confirmed_at is null
	and consent_text = 'Collected before this table tracked consent; treated as launch-only per docs/ux/DECISIONS.md M1.';

alter table waitlist_signup
	alter column consent_text drop default,
	alter column consent_locale drop default,
	alter column consent_scope drop default;

create unique index if not exists waitlist_signup_confirm_token_unique on waitlist_signup (confirm_token);

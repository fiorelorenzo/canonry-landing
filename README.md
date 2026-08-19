# canonry-landing

Marketing landing page for [Canonry](https://github.com/fiorelorenzo/canonry),
served at `canonry.io`.

The product, its specification and every product decision live in the
[canonry](https://github.com/fiorelorenzo/canonry) repository. This one holds only
the public site: copy, design, its own tiny database schema, and the container that
serves it. See `AGENTS.md` for the port assignment, the copy rules the page inherits
and the board this repository shares with the product.

Licence: [MIT](LICENSE). The product is AGPL-3.0; the landing is deliberately
permissive, because a marketing site is not a moat and pieces of it may be worth
reusing elsewhere.

## Run it

```
pnpm install
pnpm dev
```
Needs `DATABASE_URL` pointing at a Postgres holding the `waitlist_signup` table (see
below) - `docker/compose.yml` provides one for local development
(`docker compose -f docker/compose.yml up -d postgres`), matching the fallback
`vite.config.ts` already uses when `DATABASE_URL` is unset.

Confirming a signup (issue #8's double opt-in) needs `RESEND_API_KEY` and `MAIL_FROM`
too - a Resend sending key scoped to `canonry.io` and its `Name <address>` from header.
Without them the form still records the signup, it just cannot send the confirmation
link: `$lib/server/mail.ts` names the missing variable rather than failing silently.
`docker/compose.yml` passes both through from a `.env` file in the repo root if one
exists (`env_file: ../.env`, `required: false`).

## Apply the migration

```
DATABASE_URL=postgres://user:pass@host:port/db pnpm migrate
```

Runs every file under `migrations/`, in order, against that database. See
`migrations/0001_waitlist_signup.sql`, `migrations/0002_waitlist_consent.sql` and
`migrations/0003_launch_notification.sql` for what each creates and why this is a plain
SQL file rather than a migration framework. Safe to run more than once: every statement
is idempotent (`if not exists`, or a `default` plus `drop default`, per 0002's own
comment).

## Send the launch notification

The one email owed to the addresses collected before this form became a newsletter
(issue #14, and M1 in the product repository's `docs/ux/DECISIONS.md`). It goes out once,
by hand, and only `launch_only` rows are ever selected.

Read it first, in both languages, with no database and no key involved:

```
node scripts/render-launch-email.ts
```

Then see who it would go to, which sends nothing and records the plan as a run:

```
node --env-file=.env scripts/send-launch-notification.ts --mode=plan
```

Then, when the plan reads right, send it:

```
node --env-file=.env scripts/send-launch-notification.ts --mode=send --confirm
```

`--mode=send` refuses to run without `--confirm`, without `RESEND_API_KEY` and
`MAIL_FROM`, or with an origin that is not https, since the links in a real email have to
point at the real site. `--only-domain=` and `--limit=` narrow a run, so a first send can
be one address on a domain you own. `--mode=rehearse` exercises the whole send path
against a transport that prints instead of reaching the network, and refuses to run at all
unless every selected address is on a `.invalid` domain.

Every run records itself in `launch_notification_run`, one row per candidate in
`launch_notification_attempt`, and each notified row carries its own
`waitlist_signup.launch_notified_at`. A row that has been claimed can never be claimed
again, and a second delivery record for the same row is a unique-index violation, so the
send is not re-runnable rather than merely not meant to be re-run. What every row ended up
as:

```
select launch_notified_at is not null as notified, launch_notify_excluded_reason, count(*)
from waitlist_signup where consent_scope = 'launch_only' group by 1, 2;
```

## Other commands

- `pnpm build` - production build (`adapter-node`, see `docker/Dockerfile`).
- `pnpm check` - typecheck.
- `pnpm lint` / `pnpm format` - Prettier + ESLint.
- `pnpm test` - unit tests (no database required; `subscribe()`'s tests pass a fake
  `postgres.Sql`).

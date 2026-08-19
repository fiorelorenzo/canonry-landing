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
`migrations/0001_waitlist_signup.sql` and `migrations/0002_waitlist_consent.sql` for
what each creates and why this is a plain SQL file rather than a migration framework.
Safe to run more than once: every statement is idempotent (`if not exists`, or a
`default` plus `drop default`, per 0002's own comment).

## Other commands

- `pnpm build` - production build (`adapter-node`, see `docker/Dockerfile`).
- `pnpm check` - typecheck.
- `pnpm lint` / `pnpm format` - Prettier + ESLint.
- `pnpm test` - unit tests (no database required; `subscribe()`'s tests pass a fake
  `postgres.Sql`).

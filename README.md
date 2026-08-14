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

## Apply the migration

```
DATABASE_URL=postgres://user:pass@host:port/db pnpm migrate
```

Runs every file under `migrations/`, in order, against that database. See
`migrations/0001_waitlist_signup.sql` for what it creates and why this is a plain SQL
file rather than a migration framework. Safe to run more than once: every statement is
`if not exists`.

## Other commands

- `pnpm build` - production build (`adapter-node`, see `docker/Dockerfile`).
- `pnpm check` - typecheck.
- `pnpm lint` / `pnpm format` - Prettier + ESLint.
- `pnpm test` - unit tests (no database required; `subscribe()`'s tests pass a fake
  `postgres.Sql`).

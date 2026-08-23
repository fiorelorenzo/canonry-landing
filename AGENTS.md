# AGENTS.md — building the Canonry landing page

This repository serves one page at `canonry.io`. The product lives in
[canonry](https://github.com/fiorelorenzo/canonry); read its `SPEC.md` before
writing a word of copy, because the positioning is decided there and the claims
have to match what the product actually does.

## Stack and deployment

SvelteKit with `adapter-node`, built into a container and served on prodbox behind
Caddy, exactly like `loombox-landing`. Port assignment on that box: **`127.0.0.1:5195`**
(5185-5192 are taken by loombox, pitchbox and mastro; 5196 and 5296 are Canonry's own
prod and preview web, baked into both repositories' code, compose files and CI).
`ORIGIN=https://canonry.io`.

## Local development and merging

`docker compose -f docker/compose.yml up -d --build` gives a full local stack: the
app plus its own Postgres, both on loopback. The compose project name
(`canonry-landing-dev`) and both ports (`55195` for Postgres, `5195` for the app) are
hardcoded in that file, so two worktrees running it at once reattach to the same
containers instead of getting their own — only run it in one worktree at a time.
`pnpm test` never touches Postgres (`subscribe()`'s tests pass a fake `postgres.Sql`),
so lint, check and unit tests are safe from any worktree without the stack up. CI's
`docker-boot` job additionally boots the built image against its own ephemeral
Postgres service and hits `/healthz` and the waitlist form end to end; nothing local
reproduces that job, so do not report it as verified. Nothing guards `main`: no
branch protection, all three merge methods enabled, `delete_branch_on_merge` off, and
pushing a `v*.*.*` tag deploys to prodbox once `verify-ci.sh` confirms that commit's
CI run was green — the gate is you.

## Design and UI

Follows the shared UI pipeline (`ui-brief-first`, `ui-design-tokens`, `ui-visual-review`;
`uishot` renders, `uislop` scores).

- Point `uishot` at `pnpm dev` and screenshot `/` first. Vite binds on `localhost`, not
  `127.0.0.1`, so a `127.0.0.1` readiness check reports down while the app is up. `/`
  needs no database; only the waitlist's `subscribe` action touches Postgres, on submit.
- Tokens: `src/routes/layout.css`'s `@theme` block, 45 named tokens on `:root`, hand-kept
  in sync with the canonry product repo's own copy (see the file's header comment).
- No `/design` route. This is a one-page site, not a component library.
- Dark mode is real: `[data-theme='dark']` (`src/lib/theme.ts`, cookie-backed via
  `/theme`) overrides the same tokens, so a light/dark pair should differ.
- `uishot --theme dark` alone does NOT render this site's dark palette. It emulates
  `prefers-color-scheme`, and `layout.css` only defines `[data-theme='dark']` with no
  media-query fallback (the gap `src/lib/theme.ts`'s header documents), so an emulated
  dark run silently re-renders the light palette and passes vacuously. Drive the real
  palette with the cookie the server reads:
  `uishot <url> --theme dark --cookie canonry_theme=dark`.
- `--color-muted` was `#857a6a` and failed WCAG AA on all three paper surfaces
  (3.67/4.14/3.84). Fixed in #18 by adopting the product repository's own value,
  `#746b5d`, which measures 4.57:1 on `--color-paper`, 5.16:1 on `--color-panel` and
  4.78:1 on `--color-panel-2`. The dark palette's `#8e8474` was measured at the same
  time and already cleared (4.99/4.70/4.93), so it was left alone.
- Prose links: one component, `src/lib/components/InlineLink.svelte`, mirroring the product
  repository's `lib/components/ui/link/inline-link.svelte` (its #551) class for class
  (`text-accent-ink underline decoration-line-2 underline-offset-2 hover:bg-accent-bg`).
  Underline always on, never hover-only. Use it for a link inside running prose; the
  header lockup, the nav row, the footer row, the standalone back links and the door's
  button stay as they are, because an underline on a control is a regression the other
  way. This closed #20's `link-in-text-block` violations on `/privacy`, `/it`
  and `/it/privacy` (accent against the surrounding `--color-ink-2` measures 1.31:1 light,
  1.19:1 dark, so colour alone was the whole distinction). A full `--axe --fail-on serious`
  sweep of all eight routes in both palettes now exits zero; what is left is `region` on
  every route and `page-has-heading-one` on the two home pages, both `moderate`.

## What the copy may and may not say

The product's guardrails are also promises to the reader, so the page inherits them:

- **Never promise consistency.** Canonry says "here is what does not add up"; it
  never certifies that a canon is coherent. Any headline implying a guarantee is
  wrong, not merely optimistic.
- **The AI proposes, the human disposes.** Every screenshot and every animation
  must show an accept step. A demo where text appears by itself misrepresents the
  product and breaks the trust the positioning depends on.
- **No generated art in the marketing.** Generated images are a feature *inside* the
  product, for the GM's own table. On a public page they are the fastest way to lose
  a hostile audience, and the hobby's written policies are all about published art.
- Say what it costs and what the quota is. No "unlimited".

## The board

Work is tracked on **Project #9 "Canonry roadmap"** (owner `fiorelorenzo`), the same
board as the product: one roadmap, two repositories. Same four fields (`Status`,
`Priority`, `Effort`, `Parallel`), same label taxonomy, and **every issue under an
epic, with no exceptions, including an issue filed in the middle of an agent run.**
The epics live in the canonry repository, apart from this repo's own `#1 [Epic]
Landing and public site` (closed, and a closed epic still accepts children), so a
landing issue is parented over there when that is where it belongs. Parent it in the
same turn you create it: an issue with no parent is a defect in the board, and the
one way it happens is an agent filing a real finding mid-run, setting its labels and
its four fields, and forgetting the step that is a separate GraphQL mutation. When a
subagent files something on your behalf, parenting it is yours rather than theirs.
See the canonry repository's `AGENTS.md` for the full contract, the commands, and the
audit query that proves the board has no orphans left.

`area:*` values here: `landing`, `copy`, `design`, `deploy`.

## Writing style

Repo-facing text (issues, PRs, commits, comments) is first person as Lorenzo, in
English, plain prose, Conventional Commits. No em dashes, no puffery, no emoji.

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
`Priority`, `Effort`, `Parallel`), same label taxonomy, every issue under an epic.
See the canonry repository's `AGENTS.md` for the full contract and the commands.

`area:*` values here: `landing`, `copy`, `design`, `deploy`.

## Writing style

Repo-facing text (issues, PRs, commits, comments) is first person as Lorenzo, in
English, plain prose, Conventional Commits. No em dashes, no puffery, no emoji.

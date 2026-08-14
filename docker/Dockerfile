# syntax=docker/dockerfile:1
#
# Multi-stage build for this single-app repository, same shape as the canonry product
# repository's docker/landing.Dockerfile (which built this same app when it still lived
# there as apps/landing): fetch the pnpm store from the lockfile, install offline,
# build, then a runtime image carrying only production dependencies and the
# adapter-node output - never the source tree, devDependencies or the pnpm store.
#
# Build with, from the repo root:
#   docker build -f docker/Dockerfile \
#     --build-arg APP_VERSION=$(git describe --tags --always) \
#     --build-arg APP_COMMIT=$(git rev-parse --short HEAD) \
#     -t canonry-landing .

ARG NODE_VERSION=22.22.3

# ---- base: pinned Node + pnpm, nothing else -------------------------------
FROM node:${NODE_VERSION}-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.6.0 --activate
WORKDIR /app

# ---- fetch: populate the pnpm content-addressable store from the lockfile alone, so
# this layer only invalidates when the lockfile changes, never on application source.
FROM base AS fetch
COPY pnpm-lock.yaml ./
RUN pnpm fetch

# ---- build: full install (offline, from the fetched store), then build. This repo
# has no workspace and no workspace-package dependencies, so there is nothing to build
# ahead of the app itself.
FROM base AS build
COPY --from=fetch /root/.local/share/pnpm/store /root/.local/share/pnpm/store
COPY . .
RUN pnpm install --offline --frozen-lockfile

ARG APP_VERSION=0.0.0-dev
ARG APP_COMMIT=unknown
ENV APP_VERSION=${APP_VERSION} \
	APP_COMMIT=${APP_COMMIT}

RUN pnpm build

# ---- prod-deps: a second, prod-only install from just package.json + the lockfile
# (never the source tree), so devDependencies never reach the runtime image.
# `pnpm deploy` doesn't apply here - it requires a pnpm workspace, and this repository
# deliberately has none - so this is a plain second `pnpm install --prod` instead.
FROM base AS prod-deps
COPY --from=fetch /root/.local/share/pnpm/store /root/.local/share/pnpm/store
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --offline --frozen-lockfile --prod

# ---- runtime: the shipped image -------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runtime
RUN addgroup -S canonry && adduser -S canonry -G canonry
WORKDIR /app

ARG APP_VERSION=0.0.0-dev
ARG APP_COMMIT=unknown
# Baked in at build time, not read from the runtime environment: the deploy health gate
# (see docker/deploy/compose.deploy.yml and scripts/deploy/release.sh) compares the
# *served* version against the built artifact, which only means something if it cannot
# be overridden by whatever .env happens to be mounted at boot.
ENV APP_VERSION=${APP_VERSION} \
	APP_COMMIT=${APP_COMMIT} \
	NODE_ENV=production \
	PORT=5195

COPY --from=prod-deps --chown=canonry:canonry /app/node_modules ./node_modules
COPY --from=build --chown=canonry:canonry /app/build ./build
COPY --from=build --chown=canonry:canonry /app/package.json ./package.json

USER canonry
EXPOSE 5195
CMD ["node", "build/index.js"]

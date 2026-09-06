#!/usr/bin/env bash
# Builds the runtime image, boots it against a migrated Postgres, and proves
# /healthz reports the exact version just built and a real database
# connection, then exercises the waitlist form end to end. This is the
# docker-boot CI job's own body, factored out so `preflight` can run the
# identical check locally before a push (see .github/preflight.json) instead
# of only finding out on a GitHub-hosted runner after the PR exists, and so
# the job and the local check cannot drift apart.
#
# In CI the job's own `services: postgres` block already provides a running,
# health-checked Postgres on 127.0.0.1:5432, so the job exports DATABASE_URL
# pointing at it and this script never manages that container's lifecycle.
# Run standalone (preflight, a developer's shell) there is no such service,
# so the script starts and tears down its own ephemeral one, on a port other
# than 5432 since a shared devbox routinely has something else already
# bound there.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

managed_postgres=0
pg_container=""
if [ -z "${DATABASE_URL:-}" ]; then
	managed_postgres=1
	pg_container=canonry-landing-preflight-pg
	pg_port=${PREFLIGHT_PG_PORT:-25432}
	docker rm -f "$pg_container" >/dev/null 2>&1 || true
	docker run -d --name "$pg_container" \
		-e POSTGRES_USER=canonry -e POSTGRES_PASSWORD=canonry -e POSTGRES_DB=canonry_landing \
		-p "127.0.0.1:${pg_port}:5432" postgres:16 >/dev/null
	for _ in $(seq 1 30); do
		if docker exec "$pg_container" pg_isready -U canonry -d canonry_landing >/dev/null 2>&1; then
			break
		fi
		sleep 1
	done
	export DATABASE_URL="postgres://canonry:canonry@127.0.0.1:${pg_port}/canonry_landing"
fi

container_name=${CONTAINER_NAME:-canonry-landing-preflight}
image_tag=${IMAGE_TAG:-canonry-landing:preflight}

cleanup() {
	docker rm -f "$container_name" >/dev/null 2>&1 || true
	if [ "$managed_postgres" -eq 1 ]; then
		docker rm -f "$pg_container" >/dev/null 2>&1 || true
	fi
}
trap cleanup EXIT

pnpm install --frozen-lockfile
pnpm migrate

sha=${GITHUB_SHA:-$(git rev-parse HEAD)}
version="0.0.0-ci.${sha:0:7}"

docker build -f docker/Dockerfile \
	--build-arg APP_VERSION="$version" \
	--build-arg APP_COMMIT="$sha" \
	-t "$image_tag" .

# --network host: the simplest way for the freshly built container to reach
# Postgres, whether that is the CI service container on 127.0.0.1:5432 or
# this script's own one above.
docker run -d --name "$container_name" \
	--network host \
	-e DATABASE_URL="$DATABASE_URL" \
	-e ORIGIN=http://127.0.0.1:5195 \
	"$image_tag"

body=""
for _ in $(seq 1 30); do
	if body=$(curl -sf http://127.0.0.1:5195/healthz); then
		break
	fi
	sleep 1
done
if [ -z "$body" ]; then
	echo "::error::landing container never answered /healthz"
	exit 1
fi
echo "$body" | jq .

served_version=$(echo "$body" | jq -r '.version')
served_db=$(echo "$body" | jq -r '.db')

if [ "$served_version" != "$version" ]; then
	echo "::error::served version '$served_version' does not match the built artifact '$version' -- stale image"
	exit 1
fi
if [ "$served_db" != "true" ]; then
	echo "::error::/healthz reports db=false while booted against a healthy, migrated Postgres"
	exit 1
fi

# This job never sets RESEND_API_KEY/MAIL_FROM (no live Resend credential
# belongs here), so this is exactly the case $lib/server/mail.ts's own guard
# exists for: the signup still gets written and recorded as pending, and the
# action reports mail_failed rather than a silent 200. The real send is
# proved by hand against a deployed stack, not by this check (see AGENTS.md).
#
# The Origin header is required, not decoration: SvelteKit rejects a
# cross-origin form POST with 403 before the action runs. The HTTP status is
# 200 even when the action fails, and that is not a bug in the app: a
# SvelteKit form action reached with `x-sveltekit-action: true` transports
# its own result inside a 200 response, and `fail(400)` shows up as
# `status: 400` in the JSON body rather than on the response line.
status=$(curl -s -o /tmp/subscribe.json -w '%{http_code}' -X POST http://127.0.0.1:5195/?/subscribe \
	-H 'origin: http://127.0.0.1:5195' \
	-H 'x-sveltekit-action: true' \
	-d 'email=ci-check@example.com')
cat /tmp/subscribe.json
if [ "$status" != "200" ]; then
	echo "::error::expected the action protocol's own 200 transport, got $status"
	exit 1
fi
if ! grep -q '"status":400' /tmp/subscribe.json; then
	echo "::error::expected the action result to carry status 400, got: $(cat /tmp/subscribe.json)"
	exit 1
fi
if ! grep -q 'mail_failed' /tmp/subscribe.json; then
	echo "::error::expected mail_failed in the action result, got: $(cat /tmp/subscribe.json)"
	exit 1
fi
count=$(docker run --rm --network host -e PGPASSWORD=canonry postgres:16 \
	psql -h 127.0.0.1 -p "${pg_port:-5432}" -U canonry -d canonry_landing -tAc \
	"select count(*) from waitlist_signup where email='ci-check@example.com' and consent_confirmed_at is null")
if [ "$count" != "1" ]; then
	echo "::error::expected the signup to still be recorded (pending confirmation) despite the mail failure, got '$count'"
	exit 1
fi
# Same address again while still pending: the on-conflict path resends the
# confirmation (also mail_failed here) rather than erroring, and the unique
# index keeps the row count at one either way.
curl -s -o /dev/null -X POST http://127.0.0.1:5195/?/subscribe \
	-H 'origin: http://127.0.0.1:5195' \
	-H 'x-sveltekit-action: true' \
	-d 'email=ci-check@example.com'
again=$(docker run --rm --network host -e PGPASSWORD=canonry postgres:16 \
	psql -h 127.0.0.1 -p "${pg_port:-5432}" -U canonry -d canonry_landing -tAc \
	"select count(*) from waitlist_signup where email='ci-check@example.com'")
if [ "$again" != "1" ]; then
	echo "::error::a second submission of the same address changed the row count to '$again'"
	exit 1
fi

echo "image-boot check passed: version=$version db=ok waitlist=ok"

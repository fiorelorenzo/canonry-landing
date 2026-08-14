#!/usr/bin/env bash
# Shared helpers for the release/rollback/health-gate scripts under scripts/deploy/.
# Sourced, never executed directly. Every script that sources this expects
# `set -euo pipefail` to already be in effect in the caller.
#
# Ported from the canonry product repository's scripts/deploy/lib.sh (this app used to
# be apps/landing there and reused that file unmodified) and trimmed to what this
# single-app repository's release/rollback/health-gate scripts actually call: no
# backup/restore helpers, because this repository does not run the Postgres/Qdrant
# backup timers the product repository's prodbox does - its own Postgres, holding one
# table, is small enough that a plain `pg_dump` run by hand covers it for now.

# --- logging -----------------------------------------------------------
# Everything goes to stderr so a script's stdout stays reserved for the one value (a
# path, a sha, a JSON blob) a caller might want to capture.

log() {
	printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >&2
}

die() {
	log "ERROR: $*"
	exit 1
}

require_cmd() {
	for cmd in "$@"; do
		command -v "$cmd" >/dev/null 2>&1 || die "required command not found: $cmd"
	done
}

# require_env NAME - fails if the named variable is unset or empty. Never echoes the
# value, so a secret-bearing variable is still safe to pass here.
require_env() {
	for name in "$@"; do
		if [ -z "${!name:-}" ]; then
			die "required environment variable is not set: $name"
		fi
	done
}

# require_url NAME VALUE - fails unless VALUE parses as a URL with a scheme and a
# host. Never echoes VALUE (passed to python3 over an environment variable, not
# argv, so it never shows up in `ps`), so a DSN whose password is embedded in it is
# still safe to pass here.
#
# Written for DATABASE_URL: a password built from `openssl rand -base64` can contain
# `/`, `+` or `=`, and unescaped in a postgres:// DSN any of those breaks URL parsing
# without a message that names the actual problem - the postgres npm client's own
# `new URL(...)` throws a bare "Invalid URL", and only once a request reaches the app
# container. Calling this before any container starts turns that into an immediate,
# named failure instead of a 90-second health-gate timeout followed by a container-log
# read.
require_url() {
	name="$1"
	value="$2"
	# Plain (non-dash) heredoc: `<<-` strips *every* leading tab from *every*
	# line, which would flatten this script's nested if/try block down to
	# invalid Python. Left unindented (flush left) instead of tab-matched to
	# the surrounding shell for that reason.
	if ! DSN_TO_CHECK="$value" python3 - >/dev/null 2>&1 <<'PY'
import os, sys
from urllib.parse import urlsplit
u = urlsplit(os.environ["DSN_TO_CHECK"])
# scheme, a resolvable host, and an explicit userinfo separator ('@') are
# required; a password containing a raw '/' makes urlsplit stop the
# authority section before it ever reaches the real '@', so u.hostname
# ends up being a fragment of the userinfo instead (e.g. 'canonry') and
# whatever follows its ':' lands in u.port, which then fails to parse as
# an integer -- that ValueError is exactly the case this exists to catch.
ok = bool(u.scheme) and bool(u.hostname) and "@" in u.netloc
if ok:
    try:
        u.port
    except ValueError:
        ok = False
sys.exit(0 if ok else 1)
PY
	then
		die "$name does not parse as a URL -- if its password came from 'openssl rand -base64', it likely contains an unescaped '/', '+' or '=' (see docker/deploy/secrets.env.example for a URL-safe generation command)"
	fi
}

# --- atomic symlink flip ------------------------------------------------
# `ln -sfn` alone is not atomic: with an existing destination GNU coreutils unlinks it
# and then creates the new link as two separate syscalls, leaving a window where the
# link is briefly gone. Writing a symlink under a temporary name in the same directory
# and renaming it over the destination is atomic (rename(2) on the same filesystem),
# which is what "flipped atomically" means below.
atomic_symlink() {
	target="$1"
	link_path="$2"
	tmp_link="${link_path}.tmp.$$"
	ln -sfn "$target" "$tmp_link"
	mv -T "$tmp_link" "$link_path"
}

# --- release directory helpers ------------------------------------------

# release_dir BASE SHA -> path
release_dir() {
	printf '%s/releases/%s' "$1" "$2"
}

# current_release BASE -> sha, or empty if no current symlink exists yet
current_release() {
	base="$1"
	if [ -L "$base/current" ]; then
		basename "$(readlink -f "$base/current")"
	fi
}

# lock_release DIR - make a release directory and its files read-only, so nothing
# (including this script run again by mistake) can mutate a release after it has been
# published. Reversed by unlock_release before deletion. Files get 0550 rather than
# 0440: a release directory also carries a copy of scripts/deploy itself (release.sh
# copies it in alongside compose.yml), and those need their execute bit to still run.
# The extra x bit on non-script files (compose.yml, .env) is inert.
lock_release() {
	dir="$1"
	find "$dir" -type f -exec chmod 0550 {} +
	find "$dir" -type d -exec chmod 0550 {} +
}

unlock_release() {
	dir="$1"
	find "$dir" -type d -exec chmod u+w {} +
	find "$dir" -type f -exec chmod u+w {} +
}

# --- compose ------------------------------------------------------------
# Every deploy/rollback invocation of compose goes through this one function so the
# project name (hence the postgres volume name) stays stable across releases, while
# the compose file and its .env come from whichever release directory is passed in.
compose_cmd() {
	stack="$1"
	release="$2"
	shift 2
	docker compose \
		--project-name "canonry-landing-${stack}" \
		--project-directory "$release" \
		-f "$release/compose.yml" \
		"$@"
}

# --- health gate ----------------------------------------------------------
# poll_health URL EXPECTED_VERSION EXPECTED_COMMIT TIMEOUT_SECONDS INTERVAL_SECONDS
# Prints the last observed /healthz body to stdout on success. A 200 alone is not
# enough: a green curl has served a stale build before, so the served version is
# compared against the artifact this run actually built.
poll_health() {
	url="$1"
	expected_version="$2"
	expected_commit="$3"
	timeout_s="${4:-60}"
	interval_s="${5:-2}"

	deadline=$(($(date +%s) + timeout_s))
	last_body=""
	last_error=""

	while [ "$(date +%s)" -lt "$deadline" ]; do
		if last_body=$(curl -fsS --max-time 5 "$url" 2>/dev/null); then
			served_version=$(printf '%s' "$last_body" | jq -r '.version // empty')
			served_commit=$(printf '%s' "$last_body" | jq -r '.commit // empty')
			served_status=$(printf '%s' "$last_body" | jq -r '.status // empty')

			if [ "$served_status" = "down" ]; then
				last_error="reports status=down"
			elif [ "$served_version" != "$expected_version" ]; then
				last_error="served version '$served_version' does not match built artifact '$expected_version' -- stale build"
			elif [ "$served_commit" != "$expected_commit" ]; then
				last_error="served commit '$served_commit' does not match built artifact '$expected_commit' -- stale build"
			else
				printf '%s\n' "$last_body"
				return 0
			fi
		else
			last_error="request to $url failed"
		fi
		sleep "$interval_s"
	done

	log "health gate failed after ${timeout_s}s: ${last_error:-no response}"
	[ -n "$last_body" ] && log "last response body: $last_body"
	return 1
}

# --- DEPLOYED.json --------------------------------------------------------
# write_deployed_json PATH STACK RELEASE VERSION COMMIT IMAGE DEPLOYED_BY PREVIOUS STATUS [NOTE]
write_deployed_json() {
	path="$1" stack="$2" release="$3" version="$4" commit="$5"
	image="$6" deployed_by="$7" previous="$8" status="$9" note="${10:-}"

	jq -n \
		--arg stack "$stack" \
		--arg release "$release" \
		--arg version "$version" \
		--arg commit "$commit" \
		--arg image "$image" \
		--arg deployed_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
		--arg deployed_by "$deployed_by" \
		--arg previous "$previous" \
		--arg status "$status" \
		--arg note "$note" \
		'{
			stack: $stack,
			release: $release,
			version: $version,
			commit: $commit,
			image: $image,
			deployed_at: $deployed_at,
			deployed_by: $deployed_by,
			previous_release: (if $previous == "" then null else $previous end),
			status: $status,
			note: (if $note == "" then null else $note end)
		}' >"$path.tmp.$$"
	mv -T "$path.tmp.$$" "$path"
}

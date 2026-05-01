#!/usr/bin/env bash
#
# run-and-measure-parse-server.sh — bring parse-server + mongo up via
# the sample's compose, run flow.sh bootstrap + record-traffic with
# the per-call audit log enabled, run flow.sh coverage, and emit
# `coverage=PCT` onto $GITHUB_OUTPUT for the downstream
# coverage-gate job.
#
# Called from .github/workflows/parse-server-mongo.yml's
# build-coverage and release-coverage jobs (one per ref under
# comparison). Both jobs source the same script so the
# measurement is identical across refs — any drift in the
# numerator definition would otherwise produce a misleading
# delta.
#
# Inputs (all from the workflow env):
#   PARSE_FIRED_ROUTES_FILE   — per-call audit log path; passed
#                               through to flow.sh so its
#                               record-traffic loop logs each
#                               (METHOD, URL) pair, and so its
#                               coverage subcommand uses that
#                               file as the standalone numerator.
#   PARSE_PHASE               — label spliced into flow.sh's
#                               token-file slot so build vs.
#                               release runs don't collide. Also
#                               surfaced in the coverage report
#                               header for log diffing.
#   GITHUB_OUTPUT             — standard GH Actions sink for step
#                               outputs.
set -Eeuo pipefail

# Defaults match the sample's docker-compose.yml env-substituted
# vars; exporting them makes it explicit which values the helper
# is pinning so a future compose-side rename doesn't silently
# desync the helper from the sample.
export PARSE_APP_CONTAINER="${PARSE_APP_CONTAINER:-parse-server-mongo-app}"
export PARSE_MONGO_CONTAINER="${PARSE_MONGO_CONTAINER:-parse-server-mongo-mongo}"
export PARSE_HOST_PORT="${PARSE_HOST_PORT:-6100}"
export PARSE_CONTAINER_PORT="${PARSE_CONTAINER_PORT:-6100}"
export PARSE_APP_ID="${PARSE_APP_ID:-keploy-parse-app}"
export PARSE_MASTER_KEY="${PARSE_MASTER_KEY:-keploy-parse-master}"
export PARSE_MOUNT_PATH="${PARSE_MOUNT_PATH:-/parse}"
# flow.sh reads APP_PORT (host-side) for the curl base; keep it
# aligned with PARSE_HOST_PORT.
export APP_PORT="${APP_PORT:-${PARSE_HOST_PORT}}"
: "${PARSE_FIRED_ROUTES_FILE:?PARSE_FIRED_ROUTES_FILE must be set by the workflow}"

# Reset audit log for this run; otherwise a prior run's entries
# would inflate the numerator on a re-trigger.
: >"$PARSE_FIRED_ROUTES_FILE"

# Bring up parse-server + mongo. The sample's compose builds the
# parse-server image from the Dockerfile in this directory and
# wires mongo via a fixed-IP user-defined network so the URI is
# stable across runs.
docker compose up -d --build

# Wait for /parse/health to return 200. Cold parse-server boot on
# a GH runner is mostly mongo init + npm start; budget ~120s.
for i in $(seq 1 120); do
    code=$(curl -sS -o /dev/null -w '%{http_code}' \
        -H "X-Parse-Application-Id: ${PARSE_APP_ID}" \
        "http://127.0.0.1:${PARSE_HOST_PORT}${PARSE_MOUNT_PATH}/health" 2>/dev/null || echo "")
    if [ "$code" = "200" ]; then break; fi
    sleep 2
done

# Single-phase: parse-server's compose has no SKIP_INIT-style
# flag (mongo is empty on every fresh `compose up -d`), so
# flow.sh::parse_bootstrap idempotently signs up the fixed user
# and persists the session token under
# /tmp/parse-token-${PARSE_PHASE}.
bash flow.sh bootstrap 240

# Drive traffic. flow.sh::parse_record_traffic reads the
# persisted session token and exercises the curated REST +
# GraphQL surface against the running backend.
bash flow.sh record-traffic

# Coverage report — uses PARSE_FIRED_ROUTES_FILE as numerator
# since no keploy/test-set-* tree exists in the standalone case.
# parse_coverage prints to stdout, so tee into the artifact path
# the workflow uploads.
bash flow.sh coverage | tee coverage_report.txt

# Pull the percentage out of the report's `Covered N/M (XX.X%)`
# line. Anchored on the parenthesised form so a future change to
# the report's prose doesn't break the parse.
pct=$(grep -oE '\([0-9]+\.[0-9]+%\)' coverage_report.txt | head -1 | tr -d '()%')
if [ -z "$pct" ]; then
    echo "::error::Could not parse coverage percentage from coverage_report.txt"
    cat coverage_report.txt || true
    exit 1
fi
echo "coverage=${pct}" >>"$GITHUB_OUTPUT"
echo "coverage: ${pct}% (audit log: $PARSE_FIRED_ROUTES_FILE)"

docker compose down -v --remove-orphans

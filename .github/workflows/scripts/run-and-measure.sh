#!/usr/bin/env bash
#
# run-and-measure.sh — bring umami up via the sample's compose,
# run flow.sh bootstrap + record-traffic with the per-call audit
# log enabled, run flow.sh coverage, and emit `coverage=PCT`
# onto $GITHUB_OUTPUT for the downstream coverage-gate job.
#
# Called from .github/workflows/umami-postgres.yml's
# build-coverage and release-coverage jobs (one per ref under
# comparison). Both jobs source the same script so the
# measurement is identical across refs — any drift in the
# numerator definition would otherwise produce a misleading
# delta.
#
# Inputs (all from the workflow env):
#   UMAMI_FIRED_ROUTES_FILE   — per-call audit log path; passed
#                               through to flow.sh so its
#                               record-traffic loop logs each
#                               (METHOD, URL) pair, and so its
#                               coverage subcommand uses that
#                               file as the standalone
#                               numerator.
#   UMAMI_PHASE               — label spliced into the project
#                               name and the on-disk token path
#                               (`/tmp/umami-token-${UMAMI_PHASE}`)
#                               so build vs. release runs don't
#                               collide on volume names or token
#                               files. Compose project naming
#                               inside the GH runner is per-job
#                               anyway, but UMAMI_PHASE is
#                               useful for diffing logs.
#   GITHUB_OUTPUT             — standard GH Actions sink for
#                               step outputs.
set -Eeuo pipefail

export UMAMI_APP_CONTAINER="${UMAMI_APP_CONTAINER:-umami_app}"
export UMAMI_DB_CONTAINER="${UMAMI_DB_CONTAINER:-umami_db}"
export UMAMI_APP_PORT="${UMAMI_APP_PORT:-3001}"
export UMAMI_APP_SECRET="${UMAMI_APP_SECRET:-keploy-fixed-app-secret-for-deterministic-recordings}"
: "${UMAMI_FIRED_ROUTES_FILE:?UMAMI_FIRED_ROUTES_FILE must be set by the workflow}"

# Reset audit log for this run; otherwise a prior run's entries
# would inflate the numerator on a re-trigger.
: >"$UMAMI_FIRED_ROUTES_FILE"

# Stage 1: cold boot — umami's entrypoint runs Prisma migrations
# + seeds the admin user into the named volume. UMAMI_SKIP_INIT=0
# means "do the init work this time."
UMAMI_SKIP_INIT=0 docker compose up -d

# Wait for the backend to actually serve. /api/heartbeat returns
# 200 only when Next.js has bound and Prisma is connected — a
# stronger gate than wait-for-port, since umami is up on :3000
# inside the container before the Next.js server has finished
# warming the route table.
for i in $(seq 1 120); do
    code=$(curl -sS -o /dev/null -w '%{http_code}' \
        "http://127.0.0.1:${UMAMI_APP_PORT}/api/heartbeat" 2>/dev/null || echo "")
    if [ "$code" = "200" ]; then break; fi
    sleep 2
done

bash flow.sh bootstrap 240
docker compose down --remove-orphans

# Stage 2: re-launch in skip-init mode against the populated
# volume — same shape the keploy lanes use, so the recorded
# request stream matches what record/replay sees.
UMAMI_SKIP_INIT=1 docker compose up -d

# Wait again — same readiness gate. Stage 2 is faster than stage
# 1 (no migrations) but Next.js still needs ~10-30s to warm.
for i in $(seq 1 120); do
    code=$(curl -sS -o /dev/null -w '%{http_code}' \
        "http://127.0.0.1:${UMAMI_APP_PORT}/api/heartbeat" 2>/dev/null || echo "")
    if [ "$code" = "200" ]; then break; fi
    sleep 2
done

# Re-bootstrap: the auth token is request-scoped (JWT in the
# Authorization header), and stage 1's compose-down dropped the
# in-memory token. flow.sh::umami_bootstrap re-issues a fresh
# one against the same admin credentials and rewrites
# /tmp/umami-token-${UMAMI_PHASE}, which umami_record_traffic
# reads.
bash flow.sh bootstrap 240

# Drive traffic. flow.sh::umami_record_traffic re-reads the
# token from /tmp/umami-token-${UMAMI_PHASE} and tolerates
# non-2xx responses internally, so a single endpoint regression
# in umami itself doesn't abort the whole record run.
bash flow.sh record-traffic

# Coverage report — uses UMAMI_FIRED_ROUTES_FILE as numerator
# since no keploy/test-set-* tree exists in the standalone case.
# umami_list_routes walks src/app/api/**/route.ts inside the
# running container, so the app must still be up here.
COVERAGE_REPORT_FILE="$PWD/coverage_report.txt" bash flow.sh coverage

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
echo "coverage: ${pct}% (audit log: $UMAMI_FIRED_ROUTES_FILE)"

docker compose down -v --remove-orphans

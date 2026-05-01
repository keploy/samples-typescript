#!/usr/bin/env bash
#
# run-and-measure-parse-server.sh — bring parse-server + mongo up
# under the coverage overlay, run flow.sh bootstrap + record-traffic,
# stop parse-server cleanly so V8 flushes NODE_V8_COVERAGE, run
# flow.sh coverage, and emit `coverage=PCT` onto $GITHUB_OUTPUT
# for the downstream coverage-gate job.
#
# Coverage isolation contract:
#   * Base `Dockerfile` and `docker-compose.yml` are untouched.
#   * The overlay `Dockerfile.coverage` + `docker-compose.coverage.yml`
#     installs the V8 coverage entrypoint shim and sets
#     NODE_V8_COVERAGE. ONLY this script applies the overlay; the
#     keploy/integrations and keploy/enterprise CI lanes consume
#     the base compose and pay zero coverage-instrumentation cost.
#
# Inputs (from the workflow env):
#   PARSE_PHASE       — label spliced into flow.sh's token-file slot
#                       so build vs. release runs don't collide.
#   GITHUB_OUTPUT     — standard GH Actions sink for step outputs.
set -Eeuo pipefail

export PARSE_APP_CONTAINER="${PARSE_APP_CONTAINER:-parse-server-mongo-app}"
export PARSE_MONGO_CONTAINER="${PARSE_MONGO_CONTAINER:-parse-server-mongo-mongo}"
export PARSE_HOST_PORT="${PARSE_HOST_PORT:-6100}"
export PARSE_CONTAINER_PORT="${PARSE_CONTAINER_PORT:-6100}"
export PARSE_APP_ID="${PARSE_APP_ID:-keploy-parse-app}"
export PARSE_MASTER_KEY="${PARSE_MASTER_KEY:-keploy-parse-master}"
export PARSE_MOUNT_PATH="${PARSE_MOUNT_PATH:-/parse}"
export APP_PORT="${APP_PORT:-${PARSE_HOST_PORT}}"

mkdir -p coverage
chmod 777 coverage      # node UID inside container differs from runner UID
sudo rm -rf coverage/coverage-* coverage/coverage_report.txt coverage/coverage-summary.json 2>/dev/null \
    || rm -rf coverage/coverage-* coverage/coverage_report.txt coverage/coverage-summary.json 2>/dev/null \
    || true

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.coverage.yml)

# Bring up parse-server + mongo under the coverage overlay. The
# Dockerfile.coverage layer wraps node so SIGTERM produces a clean
# `process.exit(0)` (otherwise express's app.listen pins the loop
# and signal-kills bypass V8's coverage flush).
"${COMPOSE[@]}" up -d --build

# Wait for /parse/health to return 200.
for i in $(seq 1 120); do
    code=$(curl -sS -o /dev/null -w '%{http_code}' \
        -H "X-Parse-Application-Id: ${PARSE_APP_ID}" \
        "http://127.0.0.1:${PARSE_HOST_PORT}${PARSE_MOUNT_PATH}/health" 2>/dev/null || echo "")
    if [ "$code" = "200" ]; then break; fi
    sleep 2
done

# Idempotent signup + session-token persistence under
# /tmp/parse-token-${PARSE_PHASE}.
bash flow.sh bootstrap 240

# Exercise the REST + GraphQL surface.
bash flow.sh record-traffic

# Stop parse-server cleanly so the SIGTERM handler's process.exit(0)
# fires and V8 flushes NODE_V8_COVERAGE.
"${COMPOSE[@]}" stop -t 30 parse-server

# Generate the coverage report from the V8 dumps. flow.sh::parse_coverage
# launches a one-off container against the same coverage volume.
bash flow.sh coverage

if [ ! -f coverage_report.txt ]; then
    echo "::error::flow.sh coverage produced no coverage_report.txt"
    exit 1
fi

# Parse `Covered N/M (XX.X%)` — anchored on the parenthesised form
# so a future report-prose change doesn't break the parse.
pct=$(grep -oE '\([0-9]+\.[0-9]+%\)' coverage_report.txt | head -1 | tr -d '()%')
if [ -z "$pct" ]; then
    echo "::error::Could not parse coverage percentage from coverage_report.txt"
    cat coverage_report.txt || true
    exit 1
fi
echo "coverage=${pct}" >>"$GITHUB_OUTPUT"
echo "coverage: ${pct}% (JS line coverage via NODE_V8_COVERAGE + custom report)"

"${COMPOSE[@]}" down -v --remove-orphans

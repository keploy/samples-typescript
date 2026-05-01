#!/usr/bin/env bash
#
# flow.sh — keploy-independent orchestration for the umami-postgres
# sample. Modeled on samples-python/doccano-django/flow.sh.
#
# Subcommands:
#   bootstrap      — log in as admin, install a deterministic auth
#                    token so record/replay headers match. Runs
#                    once against a SKIP_INIT=0 launch; idempotent
#                    on the named volume.
#   record-traffic — drive the API: the call sequence whose
#                    responses we want recorded. Fire-and-forget;
#                    keploy is the assertion layer at replay.
#   coverage       — walk umami's route table inside the running
#                    container, compare against fired routes, emit
#                    a (method, path) coverage percentage.
#   list-routes    — print the route table the coverage report
#                    uses as its denominator (diagnostic).
#
# HANDOFF NOTE: this is a SCAFFOLD. The traffic loop in
# `umami_record_traffic` below is intentionally minimal — it hits
# the API surface enough to prove the sample boots end-to-end
# without keploy. The full traffic loop (the one
# enterprise/.ci/scripts/umami-linux.sh's `run_api_flow` function
# drives, ~250 lines of curls covering websites / events /
# sessions / reports / share-tokens / shareability) needs to be
# ported here. Until then, the keploy lane consuming this sample
# can either:
#   (a) call `bash flow.sh record-traffic` then `bash flow.sh
#       extra-traffic-from-lane` where the lane defines the
#       extra calls inline, OR
#   (b) call into `umami-linux.sh::run_api_flow` directly until
#       the migration completes.
# See https://github.com/keploy/samples-typescript/issues/<TBD>
# for the migration plan.
set -Eeuo pipefail

UMAMI_APP_PORT="${UMAMI_APP_PORT:-3001}"
UMAMI_APP_CONTAINER="${UMAMI_APP_CONTAINER:-umami_app}"
UMAMI_DB_CONTAINER="${UMAMI_DB_CONTAINER:-umami_db}"
UMAMI_ADMIN_USER="${UMAMI_ADMIN_USER:-admin}"
UMAMI_ADMIN_PASSWORD="${UMAMI_ADMIN_PASSWORD:-umami}"
UMAMI_FIXED_TOKEN="${UMAMI_FIXED_TOKEN:-}"   # populated by bootstrap; lane scripts may pre-seed
UMAMI_PHASE="${UMAMI_PHASE:-local}"
UMAMI_FIRED_ROUTES_FILE="${UMAMI_FIRED_ROUTES_FILE:-}"

base="http://127.0.0.1:${UMAMI_APP_PORT}"
h_json='Content-Type: application/json'

log_fired() {
    [ -z "$UMAMI_FIRED_ROUTES_FILE" ] && return 0
    printf '%s %s\n' "$1" "$2" >>"$UMAMI_FIRED_ROUTES_FILE"
}

# umami_wait_for_app — readiness gate. /api/heartbeat returns 200
# only when the Next.js server has bound and Prisma is connected.
# Stronger than wait_for_port; checks the actual app surface.
umami_wait_for_app() {
    local timeout=${1:-180}
    local start_ts code
    start_ts=$(date +%s)
    while true; do
        code=$(curl -sS -o /dev/null -w '%{http_code}' "${base}/api/heartbeat" 2>/dev/null || echo "")
        if [ "$code" = "200" ]; then return 0; fi
        if [ $(( $(date +%s) - start_ts )) -ge "$timeout" ]; then
            echo "umami_wait_for_app: timed out (last code: ${code:-<empty>})" >&2
            return 1
        fi
        sleep 2
    done
}

# umami_bootstrap — login as admin via /api/auth/login and capture
# the issued auth token (umami uses JWT-like tokens in the
# Authorization: Bearer header). Stores under
# /tmp/umami-token-${UMAMI_PHASE} so `record-traffic` can read it.
umami_bootstrap() {
    local timeout=${1:-180}
    umami_wait_for_app "$timeout"

    local resp code
    resp=$(curl -sS -o /tmp/umami-login.json -w '%{http_code}' \
        -H "$h_json" -X POST "${base}/api/auth/login" \
        -d "{\"username\":\"${UMAMI_ADMIN_USER}\",\"password\":\"${UMAMI_ADMIN_PASSWORD}\"}" 2>/dev/null || echo "")
    if [ "$resp" != "200" ]; then
        echo "umami_bootstrap: login failed (code ${resp:-empty})" >&2
        cat /tmp/umami-login.json >&2 || true
        return 1
    fi
    local token
    token=$(jq -r '.token' /tmp/umami-login.json 2>/dev/null)
    if [ -z "$token" ] || [ "$token" = "null" ]; then
        echo "umami_bootstrap: no token in login response" >&2
        return 1
    fi
    printf '%s' "$token" > "/tmp/umami-token-${UMAMI_PHASE}"
    echo "umami_bootstrap: token captured for phase ${UMAMI_PHASE}"
}

# umami_record_traffic — SCAFFOLD traffic loop. See HANDOFF NOTE
# at the top of this file. Hits enough of the v1 surface to prove
# the sample boots; the full coverage-extending loop is in
# enterprise/.ci/scripts/umami-linux.sh::run_api_flow and needs to
# be ported here in a follow-up.
umami_record_traffic() {
    local token
    token=$(cat "/tmp/umami-token-${UMAMI_PHASE}" 2>/dev/null || echo "")
    if [ -z "$token" ]; then
        echo "umami_record_traffic: no auth token at /tmp/umami-token-${UMAMI_PHASE}; run \`flow.sh bootstrap\` first" >&2
        return 1
    fi
    local h_auth="Authorization: Bearer ${token}"

    umami_wait_for_app 60

    log_fired GET "$base/api/heartbeat"
    curl -sS "$base/api/heartbeat" >/dev/null || true

    log_fired GET "$base/api/me"
    curl -sS -H "$h_auth" "$base/api/me" >/dev/null || true

    log_fired GET "$base/api/teams"
    curl -sS -H "$h_auth" "$base/api/teams" >/dev/null || true

    log_fired GET "$base/api/websites"
    curl -sS -H "$h_auth" "$base/api/websites" >/dev/null || true

    # Create a website so subsequent reads have something to find.
    local website_resp website_id
    log_fired POST "$base/api/websites"
    website_resp=$(curl -fsS -H "$h_auth" -H "$h_json" -X POST "$base/api/websites" \
        -d "{\"name\":\"keploy-${UMAMI_PHASE}\",\"domain\":\"sample.keploy.io\"}" 2>/dev/null || echo "")
    website_id=$(jq -r '.id // empty' <<<"$website_resp" 2>/dev/null || true)
    if [ -n "$website_id" ]; then
        log_fired GET "$base/api/websites/${website_id}"
        curl -sS -H "$h_auth" "$base/api/websites/${website_id}" >/dev/null || true
        log_fired GET "$base/api/websites/${website_id}/stats"
        curl -sS -H "$h_auth" "$base/api/websites/${website_id}/stats?startAt=0&endAt=$(date +%s%3N)" >/dev/null || true
    fi
}

umami_list_routes() {
    # umami exposes its v1 routes via the Next.js file-system
    # router. Inside the container, src/app/api/**/route.ts is
    # the source of truth. find them and emit (method, path).
    docker exec -i "$UMAMI_APP_CONTAINER" sh -c '
        cd /app && find src/app/api -name "route.ts" -o -name "route.js" 2>/dev/null | while read f; do
            rel="${f#src/app/api/}"
            rel="${rel%/route.ts}"
            rel="${rel%/route.js}"
            grep -oE "export[[:space:]]+(async[[:space:]]+)?function[[:space:]]+(GET|POST|PUT|DELETE|PATCH)" "$f" \
                | awk "{print \$NF}" \
                | sort -u \
                | while read method; do
                    echo "$method /api/${rel}"
                done
        done
    ' 2>/dev/null | sort -u
}

umami_list_recorded_routes() {
    local f method route
    local found_keploy=0
    while IFS= read -r f; do
        found_keploy=1
        method=$(awk '/^    method:/{print $2; exit}' "$f")
        route=$(awk '/^    url:/{print $2; exit}' "$f")
        route="${route%%\?*}"
        case "$route" in http://*|https://*) route="/${route#*://*/}" ;; esac
        if [ -n "$method" ] && [ -n "$route" ]; then echo "$method $route"; fi
    done < <(find keploy -type f -path '*/tests/*.yaml' 2>/dev/null) | sort -u
    if [ "$found_keploy" = "1" ]; then return 0; fi

    if [ -n "$UMAMI_FIRED_ROUTES_FILE" ] && [ -f "$UMAMI_FIRED_ROUTES_FILE" ]; then
        while IFS= read -r line; do
            method="${line%% *}"; route="${line#* }"
            route="${route%%\?*}"
            case "$route" in http://*|https://*) route="/${route#*://*/}" ;; esac
            [ -n "$method" ] && [ -n "$route" ] && echo "$method $route"
        done <"$UMAMI_FIRED_ROUTES_FILE" | sort -u
    fi
}

umami_report_coverage() {
    local routes_file recorded_file
    routes_file="$(mktemp)"; recorded_file="$(mktemp)"
    umami_list_routes >"$routes_file"
    umami_list_recorded_routes >"$recorded_file"

    if [ ! -s "$routes_file" ]; then
        echo "WARNING: umami_list_routes produced no rows; skipping coverage report" >&2
        rm -f "$routes_file" "$recorded_file"; return 0
    fi

    local total covered missing pct
    total=$(wc -l <"$routes_file" | tr -d ' '); covered=0; missing=""
    while IFS= read -r line; do
        local method="${line%% *}"
        local route="${line#* }"
        local pattern="^${method} $(printf '%s' "$route" | sed -E 's/\[[^]]+\]/[^\/]+/g')$"
        if grep -qE "$pattern" "$recorded_file"; then
            covered=$((covered + 1))
        else
            missing+="  ${method} ${route}"$'\n'
        fi
    done <"$routes_file"
    if [ "$total" -gt 0 ]; then
        pct=$(awk -v c="$covered" -v t="$total" 'BEGIN{printf "%.1f", c*100/t}')
    else pct="0.0"; fi
    {
        echo "================ umami API coverage ================"
        echo "Covered ${covered}/${total} (${pct}%)"
        if [ -n "$missing" ]; then echo "Uncovered:"; printf '%s' "$missing"; fi
        echo "===================================================="
    } | tee "${COVERAGE_REPORT_FILE:-coverage_report.txt}"
    rm -f "$routes_file" "$recorded_file"
}

case "${1:-}" in
    bootstrap)        umami_bootstrap "${2:-180}" ;;
    record-traffic)   umami_record_traffic ;;
    coverage)         umami_report_coverage ;;
    list-routes)      umami_list_routes ;;
    *)
        echo "usage: $0 {bootstrap|record-traffic|coverage|list-routes}" >&2
        exit 2 ;;
esac

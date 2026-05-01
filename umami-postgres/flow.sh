#!/usr/bin/env bash
#
# flow.sh — keploy-independent orchestration for the umami-postgres
# sample. Modeled on samples-python/doccano-django/flow.sh.
#
# Subcommands:
#   bootstrap      — log in as admin, capture the deterministic
#                    auth token so record/replay headers match.
#   record-traffic — drive the umami v2 API across auth, users,
#                    teams, websites, events, sessions, reports,
#                    share-tokens, replays, batch ingest, boards,
#                    pixels, admin sub-paths, and metric variants.
#                    Fire-and-forget; keploy is the assertion
#                    layer at replay.
#   coverage       — walk umami's route table inside the running
#                    container, compare against fired routes, emit
#                    a (method, path) coverage percentage.
#   list-routes    — print the route table the coverage report
#                    uses as its denominator (diagnostic).
#
set -Eeuo pipefail

UMAMI_APP_PORT="${UMAMI_APP_PORT:-3001}"
UMAMI_APP_CONTAINER="${UMAMI_APP_CONTAINER:-umami_app}"
UMAMI_DB_CONTAINER="${UMAMI_DB_CONTAINER:-umami_db}"
UMAMI_ADMIN_USER="${UMAMI_ADMIN_USER:-admin}"
UMAMI_ADMIN_PASSWORD="${UMAMI_ADMIN_PASSWORD:-umami}"
UMAMI_FIXED_TOKEN="${UMAMI_FIXED_TOKEN:-}"   # populated by bootstrap; lane scripts may pre-seed
UMAMI_PHASE="${UMAMI_PHASE:-local}"
UMAMI_FIRED_ROUTES_FILE="${UMAMI_FIRED_ROUTES_FILE:-}"

# Deterministic ids/names for resources the traffic loop creates.
# Fixed values keep recorded request bodies byte-stable across
# record/replay, so keploy's body-equality check passes without
# globalNoise entries for these fields.
FLOW_USER_ID="${FLOW_USER_ID:-11111111-1111-4111-8111-111111111111}"
FLOW_USER_NAME="${FLOW_USER_NAME:-keploy-ci-user}"
FLOW_USER_PASS="${FLOW_USER_PASS:-keploy-user-123}"
FLOW_USER_ROLE="${FLOW_USER_ROLE:-user}"

FLOW_WEBSITE_ID="${FLOW_WEBSITE_ID:-22222222-2222-4222-8222-222222222222}"
FLOW_WEBSITE_NAME="${FLOW_WEBSITE_NAME:-Keploy CI Website}"
FLOW_WEBSITE_DOMAIN="${FLOW_WEBSITE_DOMAIN:-keploy.example.com}"

FLOW_EVENT_NAME="${FLOW_EVENT_NAME:-keploy-ci-event}"
FLOW_EVENT_SESSION="${FLOW_EVENT_SESSION:-keploy-ci-session}"
FLOW_EVENT_TAG="${FLOW_EVENT_TAG:-compat}"

FLOW_TEAM_ID="${FLOW_TEAM_ID:-33333333-3333-4333-8333-333333333333}"
FLOW_TEAM_NAME="${FLOW_TEAM_NAME:-keploy-ci-team}"
FLOW_SHARE_ID="${FLOW_SHARE_ID:-44444444-4444-4444-8444-444444444444}"
FLOW_BOARD_ID="${FLOW_BOARD_ID:-55555555-5555-4555-8555-555555555555}"

FLOW_USER_AGENT="${FLOW_USER_AGENT:-Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36}"

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

# umami_http — wrapper around curl that fires a single request,
# logs the (method, url-without-query) tuple to the fired-routes
# file, and tolerates non-2xx responses (|| true). Same fault-
# tolerance pattern the upstream lane uses: a single endpoint
# regression in umami itself does not abort the whole record run.
umami_http() {
    local method="${1:?method required}"
    local url="${2:?url required}"
    local token="${3:-}"
    local body="${4:-}"
    local route="${url#"$base"}"
    route="${route%%\?*}"
    log_fired "$method" "$route"

    local -a curl_args
    curl_args=(-sS -o /dev/null -X "$method" \
        -H 'Accept: application/json' \
        -H "User-Agent: ${FLOW_USER_AGENT}")
    if [ -n "$token" ]; then
        curl_args+=(-H "Authorization: Bearer ${token}")
    fi
    if [ -n "$body" ]; then
        curl_args+=(-H "$h_json" --data "$body")
    fi
    curl "${curl_args[@]}" "$url" >/dev/null 2>&1 || true
}

# umami_poll_for_event — after POST /api/send, the event ingest
# is async; poll the website's /events listing until the named
# event surfaces (or the budget runs out). Each poll is a real
# GET that gets recorded, so this also widens replay coverage
# of the events listing endpoint.
umami_poll_for_event() {
    local token="${1:?token required}"
    local start_at end_at attempt url
    start_at="$(( ($(date +%s) - 3600) * 1000 ))"
    end_at="$(( ($(date +%s) + 3600) * 1000 ))"
    url="${base}/api/websites/${FLOW_WEBSITE_ID}/events?startAt=${start_at}&endAt=${end_at}&page=1&pageSize=20&search=${FLOW_EVENT_NAME}"
    for attempt in $(seq 1 10); do
        local resp
        resp="$(curl -sS -H "Authorization: Bearer ${token}" -H "User-Agent: ${FLOW_USER_AGENT}" "$url" 2>/dev/null || echo '{}')"
        log_fired GET "/api/websites/${FLOW_WEBSITE_ID}/events"
        if jq -e --arg event_name "$FLOW_EVENT_NAME" \
            '[.data[]? | select(.eventName == $event_name)] | length > 0' >/dev/null 2>&1 <<<"$resp"; then
            return 0
        fi
        sleep 2
    done
    return 0  # fire-and-forget; ingest may be slow under recording
}

# umami_record_traffic — drives the umami v2 API across every
# surface keploy needs to gate against: auth + me + admin lists,
# users CRUD, websites CRUD + analytics queries, send + batch
# ingest, sessions deep-dive, all 8 report types, share tokens
# + public share access, boards lifecycle, pixel tracker,
# metric/pageview variants, logout. Every call is logged via
# umami_http() to UMAMI_FIRED_ROUTES_FILE so the coverage
# subcommand has a numerator without needing a keploy recording.
umami_record_traffic() {
    local token
    token=$(cat "/tmp/umami-token-${UMAMI_PHASE}" 2>/dev/null || echo "")
    if [ -z "$token" ]; then
        echo "umami_record_traffic: no auth token at /tmp/umami-token-${UMAMI_PHASE}; run \`flow.sh bootstrap\` first" >&2
        return 1
    fi

    umami_wait_for_app 60

    # ---------- /api/heartbeat + /api/config + /api/me sweep ----------
    umami_http GET  "${base}/api/heartbeat" ""
    umami_http GET  "${base}/api/config"    ""
    umami_http GET  "${base}/api/me"        "$token"
    umami_http GET  "${base}/api/me/websites" "$token"
    umami_http GET  "${base}/api/me/teams"    "$token"
    umami_http GET  "${base}/api/admin/users"    "$token"
    umami_http GET  "${base}/api/admin/websites" "$token"
    umami_http GET  "${base}/api/admin/teams"    "$token"

    # ---------- Users CRUD ----------
    local user_body update_user_body
    user_body="$(jq -nc \
        --arg id "$FLOW_USER_ID" \
        --arg username "$FLOW_USER_NAME" \
        --arg password "$FLOW_USER_PASS" \
        --arg role "$FLOW_USER_ROLE" \
        '{id: $id, username: $username, password: $password, role: $role}')"
    umami_http POST "${base}/api/users" "$token" "$user_body"
    umami_http GET  "${base}/api/users/${FLOW_USER_ID}/websites" "$token"
    umami_http GET  "${base}/api/users/${FLOW_USER_ID}/teams"    "$token"
    update_user_body="$(jq -nc --arg username "$FLOW_USER_NAME" --arg role "$FLOW_USER_ROLE" '{username: $username, role: $role}')"
    umami_http POST "${base}/api/users/${FLOW_USER_ID}" "$token" "$update_user_body"

    # ---------- Websites CRUD ----------
    local website_body update_website_body
    website_body="$(jq -nc \
        --arg id "$FLOW_WEBSITE_ID" \
        --arg name "$FLOW_WEBSITE_NAME" \
        --arg domain "$FLOW_WEBSITE_DOMAIN" \
        '{id: $id, name: $name, domain: $domain}')"
    umami_http POST "${base}/api/websites" "$token" "$website_body"
    umami_http GET  "${base}/api/websites?page=1&pageSize=10"            "$token"
    umami_http GET  "${base}/api/websites/${FLOW_WEBSITE_ID}"            "$token"
    umami_http GET  "${base}/api/websites/${FLOW_WEBSITE_ID}/daterange"  "$token"
    umami_http GET  "${base}/api/websites/${FLOW_WEBSITE_ID}/active"     "$token"
    update_website_body="$(jq -nc --arg name "$FLOW_WEBSITE_NAME" --arg domain "$FLOW_WEBSITE_DOMAIN" '{name: $name, domain: $domain}')"
    umami_http POST "${base}/api/websites/${FLOW_WEBSITE_ID}" "$token" "$update_website_body"

    # ---------- Event ingest via /api/send (event variant) ----------
    local send_body
    send_body="$(jq -nc \
        --arg website "$FLOW_WEBSITE_ID" \
        --arg hostname "$FLOW_WEBSITE_DOMAIN" \
        --arg name "$FLOW_EVENT_NAME" \
        --arg session "$FLOW_EVENT_SESSION" \
        --arg tag "$FLOW_EVENT_TAG" \
        '{
          type: "event",
          payload: {
            website: $website,
            hostname: $hostname,
            language: "en-US",
            referrer: "",
            screen: "1920x1080",
            title: "Keploy CI",
            url: ("https://" + $hostname + "/umami"),
            name: $name,
            tag: $tag,
            id: $session,
            data: { source: "compat", suite: "umami" }
          }
        }')"
    umami_http POST "${base}/api/send" "" "$send_body"
    umami_poll_for_event "$token"

    # ---------- Analytics window queries ----------
    local start_at end_at window
    start_at="$(( ($(date +%s) - 24 * 3600) * 1000 ))"
    end_at="$(( ($(date +%s) + 24 * 3600) * 1000 ))"
    window="startAt=${start_at}&endAt=${end_at}"
    local startDate endDate
    startDate="$(date -u -d "@$((start_at / 1000))" +%Y-%m-%dT%H:%M:%S.000Z 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%S.000Z)"
    endDate="$(date -u -d "@$((end_at / 1000))" +%Y-%m-%dT%H:%M:%S.000Z 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%S.000Z)"

    umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/stats?${window}"                            "$token"
    umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/pageviews?${window}&unit=hour&timezone=UTC" "$token"
    umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/sessions?${window}"                         "$token"
    umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/sessions/stats?${window}"                   "$token"
    umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/sessions/weekly?${window}&timezone=UTC"     "$token"
    umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/session-data/properties?${window}"          "$token"
    umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/event-data?${window}"                       "$token"
    umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/event-data/stats?${window}"                 "$token"
    umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/events/series?${window}&unit=hour&timezone=UTC" "$token"
    umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/events/stats?${window}&unit=hour&timezone=UTC"  "$token"
    umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/values?${window}&type=path"                 "$token"
    umami_http GET "${base}/api/realtime/${FLOW_WEBSITE_ID}?startAt=${start_at}"                        "$token"
    umami_http GET "${base}/api/reports?websiteId=${FLOW_WEBSITE_ID}&page=1&pageSize=10"                "$token"
    umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/reports?page=1&pageSize=10"                 "$token"
    umami_http GET "${base}/api/teams?page=1&pageSize=10"                                               "$token"

    local metric_type
    for metric_type in path referrer browser os device country event; do
        umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/metrics?${window}&type=${metric_type}" "$token"
    done
    umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/metrics/expanded?${window}&type=path" "$token"

    # ---------- Reports — every type umami v2 ships ----------
    local report_body
    report_body="$(jq -nc \
        --arg websiteId "$FLOW_WEBSITE_ID" --arg startDate "$startDate" --arg endDate "$endDate" \
        '{websiteId: $websiteId, type: "breakdown", filters: {},
          parameters: {startDate: $startDate, endDate: $endDate, fields: ["path"]}}')"
    umami_http POST "${base}/api/reports/breakdown" "$token" "$report_body"

    report_body="$(jq -nc \
        --arg websiteId "$FLOW_WEBSITE_ID" --arg startDate "$startDate" --arg endDate "$endDate" \
        '{websiteId: $websiteId, type: "goal", filters: {},
          parameters: {startDate: $startDate, endDate: $endDate, type: "url", value: "/umami"}}')"
    umami_http POST "${base}/api/reports/goal" "$token" "$report_body"

    report_body="$(jq -nc \
        --arg websiteId "$FLOW_WEBSITE_ID" --arg startDate "$startDate" --arg endDate "$endDate" \
        --arg event "$FLOW_EVENT_NAME" \
        '{websiteId: $websiteId, type: "funnel", filters: {},
          parameters: {startDate: $startDate, endDate: $endDate, window: 60,
            steps: [{type: "event", value: $event}, {type: "path", value: "/umami"}]}}')"
    umami_http POST "${base}/api/reports/funnel" "$token" "$report_body"

    report_body="$(jq -nc \
        --arg websiteId "$FLOW_WEBSITE_ID" --arg startDate "$startDate" --arg endDate "$endDate" \
        '{websiteId: $websiteId, type: "journey", filters: {},
          parameters: {startDate: $startDate, endDate: $endDate, steps: 3}}')"
    umami_http POST "${base}/api/reports/journey" "$token" "$report_body"

    report_body="$(jq -nc \
        --arg websiteId "$FLOW_WEBSITE_ID" --arg startDate "$startDate" --arg endDate "$endDate" \
        '{websiteId: $websiteId, type: "retention", filters: {},
          parameters: {startDate: $startDate, endDate: $endDate, timezone: "UTC"}}')"
    umami_http POST "${base}/api/reports/retention" "$token" "$report_body"

    report_body="$(jq -nc \
        --arg websiteId "$FLOW_WEBSITE_ID" --arg startDate "$startDate" --arg endDate "$endDate" \
        '{websiteId: $websiteId, type: "utm", filters: {},
          parameters: {startDate: $startDate, endDate: $endDate}}')"
    umami_http POST "${base}/api/reports/utm" "$token" "$report_body"

    report_body="$(jq -nc \
        --arg websiteId "$FLOW_WEBSITE_ID" --arg startDate "$startDate" --arg endDate "$endDate" \
        --arg event "$FLOW_EVENT_NAME" \
        '{websiteId: $websiteId, type: "attribution", filters: {},
          parameters: {startDate: $startDate, endDate: $endDate, model: "first-click", type: "event", step: $event}}')"
    umami_http POST "${base}/api/reports/attribution" "$token" "$report_body"

    report_body="$(jq -nc \
        --arg websiteId "$FLOW_WEBSITE_ID" --arg startDate "$startDate" --arg endDate "$endDate" \
        '{websiteId: $websiteId, type: "performance", filters: {},
          parameters: {startDate: $startDate, endDate: $endDate, unit: "hour", timezone: "UTC"}}')"
    umami_http POST "${base}/api/reports/performance" "$token" "$report_body"

    # Reset accumulated stats — drives the website-scoped reset path.
    umami_http POST "${base}/api/websites/${FLOW_WEBSITE_ID}/reset" "$token" "{}"

    # ---------- User read-back (round-trip the user CRUD) ----------
    umami_http GET "${base}/api/users/${FLOW_USER_ID}" "$token"

    # ---------- /api/auth/verify — drives the auth interceptor ----------
    umami_http GET "${base}/api/auth/verify" "$token"

    # ---------- Teams CRUD lifecycle ----------
    local team_body update_team_body add_member_body
    team_body="$(jq -nc --arg id "$FLOW_TEAM_ID" --arg name "$FLOW_TEAM_NAME" '{id: $id, name: $name}')"
    umami_http POST   "${base}/api/teams"                                "$token" "$team_body"
    umami_http GET    "${base}/api/teams/${FLOW_TEAM_ID}"                "$token"
    umami_http GET    "${base}/api/teams/${FLOW_TEAM_ID}/users"          "$token"
    umami_http GET    "${base}/api/teams/${FLOW_TEAM_ID}/websites"       "$token"
    add_member_body="$(jq -nc --arg userId "$FLOW_USER_ID" --arg role "team-member" '{userId: $userId, role: $role}')"
    umami_http POST   "${base}/api/teams/${FLOW_TEAM_ID}/users"                       "$token" "$add_member_body"
    umami_http GET    "${base}/api/teams/${FLOW_TEAM_ID}/users/${FLOW_USER_ID}"       "$token"
    update_team_body="$(jq -nc --arg name "${FLOW_TEAM_NAME}-renamed" '{name: $name}')"
    umami_http POST   "${base}/api/teams/${FLOW_TEAM_ID}"                             "$token" "$update_team_body"
    umami_http GET    "${base}/api/users/${FLOW_USER_ID}/teams"                       "$token"
    umami_http DELETE "${base}/api/teams/${FLOW_TEAM_ID}/users/${FLOW_USER_ID}"       "$token"
    umami_http DELETE "${base}/api/teams/${FLOW_TEAM_ID}"                             "$token"

    # ---------- Share tokens + public-share access ----------
    local share_body
    share_body="$(jq -nc --arg id "$FLOW_SHARE_ID" --arg name "keploy-ci-share" --arg websiteId "$FLOW_WEBSITE_ID" \
        '{id: $id, name: $name, websiteId: $websiteId}')"
    umami_http POST "${base}/api/websites/${FLOW_WEBSITE_ID}/shares" "$token" "$share_body"
    umami_http GET  "${base}/api/websites/${FLOW_WEBSITE_ID}/shares" "$token"
    umami_http GET  "${base}/api/share/${FLOW_SHARE_ID}"             ""

    # ---------- Replays + sessions deep-dive ----------
    umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/replays?${window}"                                "$token"
    umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/sessions/${FLOW_EVENT_SESSION}?${window}"          "$token"
    umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/sessions/${FLOW_EVENT_SESSION}/activity?${window}" "$token"
    umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/sessions/${FLOW_EVENT_SESSION}/properties?${window}" "$token"
    umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/sessions/${FLOW_EVENT_SESSION}/replays?${window}"  "$token"

    # ---------- Boards lifecycle ----------
    local board_body
    board_body="$(jq -nc --arg id "$FLOW_BOARD_ID" --arg name "keploy-ci-board" \
        --arg websiteId "$FLOW_WEBSITE_ID" \
        '{id: $id, name: $name, type: "mixed", status: "open", websiteId: $websiteId}')"
    umami_http POST   "${base}/api/boards"                          "$token" "$board_body"
    umami_http GET    "${base}/api/boards"                          "$token"
    umami_http GET    "${base}/api/boards/${FLOW_BOARD_ID}"         "$token"
    umami_http GET    "${base}/api/boards/${FLOW_BOARD_ID}/shares"  "$token"
    umami_http DELETE "${base}/api/boards/${FLOW_BOARD_ID}"         "$token"

    # ---------- Batch tracker (multi-event ingest) ----------
    local batch_body
    batch_body="$(jq -nc \
        --arg website "$FLOW_WEBSITE_ID" \
        --arg hostname "$FLOW_WEBSITE_DOMAIN" \
        --arg session "$FLOW_EVENT_SESSION" \
        '[
          { "type": "event", "payload": { "website": $website, "hostname": $hostname, "url": "/batch-1", "name": "click",  "id": $session } },
          { "type": "event", "payload": { "website": $website, "hostname": $hostname, "url": "/batch-2", "name": "scroll", "id": $session } },
          { "type": "identify", "payload": { "website": $website, "hostname": $hostname, "id": $session, "data": { "plan": "ci" } } }
        ]')"
    umami_http POST "${base}/api/batch" "" "$batch_body"

    # ---------- Identify event variant ----------
    local identify_body
    identify_body="$(jq -nc \
        --arg website "$FLOW_WEBSITE_ID" \
        --arg hostname "$FLOW_WEBSITE_DOMAIN" \
        --arg session "$FLOW_EVENT_SESSION" \
        '{
          type: "identify",
          payload: {
            website: $website, hostname: $hostname, id: $session,
            data: { plan: "ci-pro", company: "keploy" }
          }
        }')"
    umami_http POST "${base}/api/send" "" "$identify_body"

    # ---------- Pixel tracker ----------
    umami_http GET "${base}/api/pixels?websiteId=${FLOW_WEBSITE_ID}&hostname=${FLOW_WEBSITE_DOMAIN}&url=/pixel" "$token"

    # ---------- /api/me/* + /api/admin/* paged variants ----------
    umami_http GET "${base}/api/me/teams"                                       "$token"
    umami_http GET "${base}/api/me/websites?page=1&pageSize=20"                 "$token"
    umami_http GET "${base}/api/admin/users?page=1&pageSize=10&search=keploy"   "$token"
    umami_http GET "${base}/api/admin/websites?page=1&pageSize=10"              "$token"
    umami_http GET "${base}/api/admin/teams?page=1&pageSize=10"                 "$token"

    # ---------- Saved-report CRUD ----------
    local saved_report_body saved_report_response saved_report_id
    saved_report_body="$(jq -nc \
        --arg websiteId "$FLOW_WEBSITE_ID" --arg name "keploy-ci-report" \
        --arg startDate "$startDate" --arg endDate "$endDate" \
        '{websiteId: $websiteId, name: $name, type: "breakdown",
          parameters: {startDate: $startDate, endDate: $endDate, fields: ["path"]}}')"
    saved_report_response="$(curl -sS -H "Authorization: Bearer ${token}" -H "User-Agent: ${FLOW_USER_AGENT}" \
        -H "$h_json" -X POST "${base}/api/reports" --data "$saved_report_body" 2>/dev/null || true)"
    log_fired POST "/api/reports"
    saved_report_id="$(jq -r '.id // empty' <<<"$saved_report_response" 2>/dev/null || true)"
    if [ -n "${saved_report_id:-}" ]; then
        umami_http GET "${base}/api/reports/${saved_report_id}" "$token"
        local update_report_body
        update_report_body="$(jq -nc \
            --arg websiteId "$FLOW_WEBSITE_ID" --arg name "keploy-ci-report-renamed" \
            --arg startDate "$startDate" --arg endDate "$endDate" \
            '{websiteId: $websiteId, name: $name, type: "breakdown",
              parameters: {startDate: $startDate, endDate: $endDate, fields: ["path"]}}')"
        umami_http POST   "${base}/api/reports/${saved_report_id}" "$token" "$update_report_body"
        umami_http DELETE "${base}/api/reports/${saved_report_id}" "$token"
    fi

    # ---------- Metric query-string variants (parser branches) ----------
    umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/metrics?${window}&type=path&search=/"        "$token"
    umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/metrics?${window}&type=referrer&limit=10"     "$token"
    umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/metrics?${window}&type=event&search=keploy"   "$token"

    # ---------- Pageviews unit/timezone variants ----------
    umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/pageviews?${window}&unit=day&timezone=America%2FNew_York" "$token"
    umami_http GET "${base}/api/websites/${FLOW_WEBSITE_ID}/pageviews?${window}&unit=hour&timezone=Europe%2FLondon"   "$token"

    # ---------- 405 path on heartbeat (POST is not allowed) ----------
    umami_http POST "${base}/api/heartbeat" "" "{}"

    # ---------- Logout ----------
    umami_http POST "${base}/api/auth/logout" "$token" "{}"
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

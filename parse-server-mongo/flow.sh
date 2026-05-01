#!/usr/bin/env bash
# Subcommand-driven traffic and coverage helper for the parse-server-mongo
# keploy compat lane sample.
#
# Subcommands:
#   bootstrap [timeout]   wait for /parse/health, sign up the fixed user,
#                         capture a session token, persist it under
#                         /tmp/parse-token-${PARSE_PHASE}. Idempotent —
#                         re-runs treat already-exists as success.
#   record-traffic        drive the broad parse-server REST + GraphQL
#                         surface that the recording should capture.
#                         Reads the persisted session token. Honours
#                         PARSE_FIRED_ROUTES_FILE for fire logging.
#   coverage              print (method,route) coverage. Numerator from
#                         keploy/test-set-*.yaml when present, else
#                         falls back to PARSE_FIRED_ROUTES_FILE.
#   list-routes           print the curated route table.
#
# Determinism: bootstrap pins the user objectId/session token via the
# PARSE_FIXED_* env vars so replay sees stable identifiers.
#
# Boot-phase divergence preserved: bootstrap + record-traffic together
# still drive the multi-class _SCHEMA mutation pattern (GameScore,
# PlayerStats, Achievement) the original focused reproducer captured.

set -Eeuo pipefail

APP_PORT="${APP_PORT:-6100}"
PARSE_APP_ID="${PARSE_APP_ID:-${PARSE_SERVER_APPLICATION_ID:-keploy-parse-app}}"
PARSE_MASTER_KEY="${PARSE_MASTER_KEY:-${PARSE_SERVER_MASTER_KEY:-keploy-parse-master}}"
PARSE_MOUNT_PATH="${PARSE_MOUNT_PATH:-/parse}"
PARSE_PHASE="${PARSE_PHASE:-record}"

PARSE_FIXED_USER_ID="${PARSE_FIXED_USER_ID:-keploy-user-id}"
PARSE_FIXED_USERNAME="${PARSE_FIXED_USERNAME:-keploy-user}"
PARSE_FIXED_PASSWORD="${PARSE_FIXED_PASSWORD:-KeployPass123!}"
PARSE_FIXED_EMAIL="${PARSE_FIXED_EMAIL:-keploy@example.com}"
PARSE_FIXED_SCORE_ID="${PARSE_FIXED_SCORE_ID:-keploy-score-id}"
PARSE_FIXED_PLAYER_ID="${PARSE_FIXED_PLAYER_ID:-keploy-player-id}"
PARSE_FIXED_ACHIEVEMENT_ID="${PARSE_FIXED_ACHIEVEMENT_ID:-keploy-achievement-id}"

PARSE_FIRED_ROUTES_FILE="${PARSE_FIRED_ROUTES_FILE:-}"
PARSE_TOKEN_FILE="${PARSE_TOKEN_FILE:-/tmp/parse-token-${PARSE_PHASE}}"

base="http://localhost:${APP_PORT}${PARSE_MOUNT_PATH}"
h_app=(-H "X-Parse-Application-Id: ${PARSE_APP_ID}")
h_master=(-H "X-Parse-Master-Key: ${PARSE_MASTER_KEY}")
h_json=(-H "Content-Type: application/json")

# log_fired METHOD URL — append the hit to PARSE_FIRED_ROUTES_FILE if set.
# The URL is normalised to its path component (no scheme/host, no query).
log_fired() {
  local method="$1"
  local url="$2"
  local route

  route="${url#http://}"
  route="${route#https://}"
  route="${route#*/}"
  route="/${route%%\?*}"
  route="${route%/}"
  [ -z "${route}" ] && route="/"

  if [ -n "${PARSE_FIRED_ROUTES_FILE}" ]; then
    printf '%s %s\n' "${method}" "${route}" >> "${PARSE_FIRED_ROUTES_FILE}"
  fi
}

# fire METHOD URL [curl args...] — log then send a tolerant curl.
fire() {
  local method="$1"
  local url="$2"
  shift 2
  log_fired "${method}" "${url}"
  curl -sS -X "${method}" "${url}" "$@" >/dev/null 2>&1 || true
}

# urlenc — minimal URL-encoder for query payloads.
urlenc() {
  jq -rn --arg v "$1" '$v|@uri'
}

parse_wait_for_health() {
  local timeout="${1:-180}"
  local i
  echo "[flow] waiting up to ${timeout}s for parse-server /health..."
  for i in $(seq 1 "${timeout}"); do
    if curl -fsS "${h_app[@]}" "${base}/health" >/dev/null 2>&1; then
      echo "[flow] parse-server reachable after ${i}s"
      return 0
    fi
    sleep 1
  done
  echo "[flow] timeout waiting for parse-server"
  return 1
}

parse_bootstrap() {
  local timeout="${1:-180}"
  parse_wait_for_health "${timeout}"

  # Give parse-server a beat to finish its boot eager-index sweep so the
  # recording captures pre-mutation find _SCHEMA snapshots before any
  # state mutation lands. Without this, all the find _SCHEMA captures
  # might come AFTER the first user class is inserted, so there's no
  # diverging same-shape candidate set for the matcher's tiebreaker to
  # contend over.
  sleep 3

  local signup_resp signup_status login_resp token

  signup_resp="$(curl -sS -o /tmp/parse-bootstrap-signup.body -w '%{http_code}' \
    -X POST "${base}/users" \
    "${h_app[@]}" "${h_json[@]}" \
    --data "{\"objectId\":\"${PARSE_FIXED_USER_ID}\",\"username\":\"${PARSE_FIXED_USERNAME}\",\"password\":\"${PARSE_FIXED_PASSWORD}\",\"email\":\"${PARSE_FIXED_EMAIL}\"}" \
    || true)"
  signup_status="${signup_resp}"
  log_fired POST "${base}/users"

  case "${signup_status}" in
    2*) echo "[flow] signup ok (HTTP ${signup_status})" ;;
    4*)
      # 4xx during bootstrap is treated as already-exists; re-run case.
      echo "[flow] signup returned HTTP ${signup_status} — treating as already-exists"
      ;;
    *)
      echo "[flow] signup unexpected status: ${signup_status}"
      cat /tmp/parse-bootstrap-signup.body || true
      ;;
  esac

  login_resp="$(curl -sS "${h_app[@]}" \
    "${base}/login?username=$(urlenc "${PARSE_FIXED_USERNAME}")&password=$(urlenc "${PARSE_FIXED_PASSWORD}")" \
    || true)"
  log_fired GET "${base}/login"

  token="$(printf '%s' "${login_resp}" | jq -r '.sessionToken // empty' 2>/dev/null || true)"
  if [ -z "${token}" ]; then
    echo "[flow] no sessionToken in login response — bootstrap will continue but session-bound calls will be skipped"
    : > "${PARSE_TOKEN_FILE}"
  else
    printf '%s' "${token}" > "${PARSE_TOKEN_FILE}"
    echo "[flow] session token persisted to ${PARSE_TOKEN_FILE}"
  fi
}

parse_load_token() {
  if [ -s "${PARSE_TOKEN_FILE}" ]; then
    cat "${PARSE_TOKEN_FILE}"
  else
    printf ''
  fi
}

parse_record_traffic() {
  local token
  token="$(parse_load_token)"

  local h_session=()
  if [ -n "${token}" ]; then
    h_session=(-H "X-Parse-Session-Token: ${token}")
  fi

  # ----- Tier 1: read-only probes (drives schema cache reload) -----
  fire GET "${base}/health"        "${h_app[@]}"
  fire GET "${base}/serverInfo"    "${h_app[@]}" "${h_master[@]}"
  fire GET "${base}/config"        "${h_app[@]}" "${h_master[@]}"
  fire GET "${base}/schemas"       "${h_app[@]}" "${h_master[@]}"
  fire GET "${base}/schemas/_User" "${h_app[@]}" "${h_master[@]}"

  # ----- Tier 2: user-class mutations driving _SCHEMA divergence -----
  # Each POST /classes/<NewClass> inserts the class into _SCHEMA, refreshes
  # parse-server's schema cache, and runs listIndexes on the new collection.
  # Three distinct classes widen the divergence window to four shapes.
  fire POST "${base}/classes/GameScore" \
    "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" \
    --data "{\"objectId\":\"${PARSE_FIXED_SCORE_ID}\",\"score\":10,\"playerName\":\"${PARSE_FIXED_USERNAME}\"}"

  fire POST "${base}/classes/PlayerStats" \
    "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" \
    --data "{\"objectId\":\"${PARSE_FIXED_PLAYER_ID}\",\"level\":1,\"xp\":100,\"playerName\":\"${PARSE_FIXED_USERNAME}\"}"

  fire POST "${base}/classes/Achievement" \
    "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" \
    --data "{\"objectId\":\"${PARSE_FIXED_ACHIEVEMENT_ID}\",\"name\":\"first-class\",\"unlocked\":true}"

  # ----- Tier 3: read-after-mutation (drives post-mutation _SCHEMA captures) -----
  fire GET "${base}/classes/GameScore/${PARSE_FIXED_SCORE_ID}"     "${h_app[@]}" "${h_master[@]}"
  fire GET "${base}/classes/PlayerStats/${PARSE_FIXED_PLAYER_ID}"  "${h_app[@]}" "${h_master[@]}"
  fire GET "${base}/classes/Achievement/${PARSE_FIXED_ACHIEVEMENT_ID}" "${h_app[@]}" "${h_master[@]}"

  fire PUT "${base}/classes/GameScore/${PARSE_FIXED_SCORE_ID}" \
    "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" --data '{"score":99}'

  fire GET "${base}/schemas"           "${h_app[@]}" "${h_master[@]}"
  fire GET "${base}/schemas/GameScore" "${h_app[@]}" "${h_master[@]}"

  # ----- Class queries: count, where, keys+order+limit -----
  local where_q
  where_q="$(urlenc '{"score":{"$gt":0}}')"
  fire GET "${base}/classes/GameScore?where=${where_q}" "${h_app[@]}" "${h_master[@]}"
  fire GET "${base}/classes/GameScore?count=1&limit=0"  "${h_app[@]}" "${h_master[@]}"
  fire GET "${base}/classes/GameScore?keys=score,playerName&order=-score&limit=10&skip=0" \
    "${h_app[@]}" "${h_master[@]}"

  # ----- Users router: GET /users, GET /users/me, PUT /users/{id}, GET /users?where -----
  fire GET "${base}/users"                       "${h_app[@]}" "${h_master[@]}"
  fire GET "${base}/users/${PARSE_FIXED_USER_ID}" "${h_app[@]}" "${h_master[@]}"
  if [ "${#h_session[@]}" -gt 0 ]; then
    fire GET "${base}/users/me" "${h_app[@]}" "${h_session[@]}"
    fire PUT "${base}/users/${PARSE_FIXED_USER_ID}" \
      "${h_app[@]}" "${h_session[@]}" "${h_json[@]}" \
      --data '{"customField":"updated-via-session"}'
  fi
  fire PUT "${base}/users/${PARSE_FIXED_USER_ID}" \
    "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" \
    --data '{"customField":"updated-via-master"}'
  local user_q
  user_q="$(urlenc "{\"username\":\"${PARSE_FIXED_USERNAME}\"}")"
  fire GET "${base}/users?where=${user_q}" "${h_app[@]}" "${h_master[@]}"

  # ----- Sessions: GET /sessions, GET /sessions/me, DELETE no-such -----
  fire GET "${base}/sessions" "${h_app[@]}" "${h_master[@]}"
  if [ "${#h_session[@]}" -gt 0 ]; then
    fire GET "${base}/sessions/me" "${h_app[@]}" "${h_session[@]}"
  fi
  fire DELETE "${base}/sessions/no-such-session-id" "${h_app[@]}" "${h_master[@]}"

  # ----- Roles: GET, POST, GET by id, PUT (relation add) -----
  fire GET "${base}/roles" "${h_app[@]}" "${h_master[@]}"
  fire POST "${base}/roles" \
    "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" \
    --data "{\"name\":\"keployRole\",\"ACL\":{\"*\":{\"read\":true}},\"users\":{\"__type\":\"Relation\",\"className\":\"_User\"},\"roles\":{\"__type\":\"Relation\",\"className\":\"_Role\"}}"
  local role_q
  role_q="$(urlenc '{"name":"keployRole"}')"
  fire GET "${base}/roles?where=${role_q}" "${h_app[@]}" "${h_master[@]}"

  # ----- Files: text, json, binary -----
  fire POST "${base}/files/keploy-cov.txt" \
    "${h_app[@]}" "${h_master[@]}" \
    -H 'Content-Type: text/plain' \
    --data-binary 'keploy-coverage-payload'
  fire POST "${base}/files/keploy-cov.json" \
    "${h_app[@]}" "${h_master[@]}" \
    -H 'Content-Type: application/json' \
    --data-binary '{"k":"v"}'
  fire POST "${base}/files/keploy-cov.bin" \
    "${h_app[@]}" "${h_master[@]}" \
    -H 'Content-Type: application/octet-stream' \
    --data-binary 'binary-payload-12345'

  # ----- Cloud functions / jobs (drives FunctionsRouter cold paths) -----
  fire POST "${base}/functions/no-such-fn" \
    "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" --data '{}'
  fire POST "${base}/jobs/no-such-job" \
    "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" --data '{}'

  # ----- Schemas: POST/PUT/DELETE on a custom class -----
  fire POST "${base}/schemas/CovClass" \
    "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" \
    --data '{"className":"CovClass","fields":{"name":{"type":"String"},"score":{"type":"Number"}}}'
  fire PUT "${base}/schemas/CovClass" \
    "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" \
    --data '{"className":"CovClass","fields":{"tags":{"type":"Array"}}}'
  fire PUT "${base}/schemas/CovClass" \
    "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" \
    --data '{"className":"CovClass","fields":{"tags":{"__op":"Delete"}}}'
  fire DELETE "${base}/schemas/CovClass" "${h_app[@]}" "${h_master[@]}"

  # ----- Hooks: list functions, register/update/delete a function hook -----
  fire GET "${base}/hooks/functions" "${h_app[@]}" "${h_master[@]}"
  fire POST "${base}/hooks/functions" \
    "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" \
    --data '{"functionName":"covFn","url":"http://example.com/hook"}'
  fire PUT "${base}/hooks/functions/covFn" \
    "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" \
    --data '{"url":"http://example.com/hook2"}'
  fire DELETE "${base}/hooks/functions/covFn" "${h_app[@]}" "${h_master[@]}"
  fire GET "${base}/hooks/triggers" "${h_app[@]}" "${h_master[@]}"

  # ----- GraphQL: query + mutation + introspection -----
  fire POST "${base}/graphql" \
    "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" \
    --data '{"query":"{ __typename }"}'
  fire POST "${base}/graphql" \
    "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" \
    --data '{"query":"{ __schema { queryType { name } mutationType { name } } }"}'
  fire POST "${base}/graphql" \
    "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" \
    --data '{"query":"mutation { createGameScore(input: { fields: { score: 11, playerName: \"gql-1\" } }) { gameScore { objectId score } } }"}'

  # ----- Aggregate (drives AggregateRouter; not all upstreams ship this) -----
  local agg_q
  agg_q="$(urlenc '[{"$group":{"_id":"$playerName"}}]')"
  fire GET "${base}/aggregate/GameScore?pipeline=${agg_q}" "${h_app[@]}" "${h_master[@]}"

  # ----- Cleanup: DELETE the seeded class objects -----
  fire DELETE "${base}/classes/GameScore/${PARSE_FIXED_SCORE_ID}"     "${h_app[@]}" "${h_master[@]}"
  fire DELETE "${base}/classes/PlayerStats/${PARSE_FIXED_PLAYER_ID}"  "${h_app[@]}" "${h_master[@]}"
  fire DELETE "${base}/classes/Achievement/${PARSE_FIXED_ACHIEVEMENT_ID}" "${h_app[@]}" "${h_master[@]}"

  if [ "${#h_session[@]}" -gt 0 ]; then
    fire POST "${base}/logout" \
      "${h_app[@]}" "${h_session[@]}" "${h_json[@]}" --data '{}'
  fi

  echo "[flow] record-traffic complete"
}

parse_list_routes() {
  cat <<'ROUTES'
GET /parse/health
GET /parse/serverInfo
GET /parse/config
POST /parse/users
GET /parse/users
GET /parse/users/me
GET /parse/users/{objectId}
PUT /parse/users/{objectId}
GET /parse/login
POST /parse/logout
GET /parse/sessions
GET /parse/sessions/me
DELETE /parse/sessions/{objectId}
POST /parse/classes/{className}
GET /parse/classes/{className}
GET /parse/classes/{className}/{objectId}
PUT /parse/classes/{className}/{objectId}
DELETE /parse/classes/{className}/{objectId}
GET /parse/aggregate/{className}
GET /parse/schemas
GET /parse/schemas/{className}
POST /parse/schemas/{className}
PUT /parse/schemas/{className}
DELETE /parse/schemas/{className}
POST /parse/functions/{name}
POST /parse/jobs/{name}
GET /parse/roles
POST /parse/roles
POST /parse/files/{filename}
GET /parse/hooks/functions
POST /parse/hooks/functions
PUT /parse/hooks/functions/{name}
DELETE /parse/hooks/functions/{name}
GET /parse/hooks/triggers
POST /parse/graphql
ROUTES
}

# parse_collect_recorded_routes — read keploy/test-set-*/tests/*.yaml, emit
# normalised "METHOD /path" lines. When no recording is present, fall back
# to PARSE_FIRED_ROUTES_FILE.
parse_collect_recorded_routes() {
  local out
  out=""

  if compgen -G "keploy/test-set-*/tests/*.yaml" > /dev/null; then
    while IFS= read -r f; do
      local method route
      method="$(awk '/^    method:/{print $2; exit}' "${f}")"
      route="$(awk '/^    url:/{print $2; exit}' "${f}")"
      route="${route%%\?*}"
      case "${route}" in
        http://*|https://*) route="/${route#*://*/}" ;;
      esac
      if [ -n "${method}" ] && [ -n "${route}" ]; then
        out+="${method} ${route}"$'\n'
      fi
    done < <(find keploy -type f -path '*/tests/*.yaml' 2>/dev/null | sort)
  fi

  if [ -z "${out}" ] && [ -n "${PARSE_FIRED_ROUTES_FILE}" ] && [ -f "${PARSE_FIRED_ROUTES_FILE}" ]; then
    out="$(cat "${PARSE_FIRED_ROUTES_FILE}")"$'\n'
  fi

  printf '%s' "${out}" | sort -u
}

parse_coverage() {
  local routes_file recorded_file total covered missing pct method route pattern line

  routes_file="$(mktemp)"
  recorded_file="$(mktemp)"

  parse_list_routes | sort -u > "${routes_file}"
  parse_collect_recorded_routes > "${recorded_file}"

  total="$(wc -l < "${routes_file}" | tr -d ' ')"
  covered=0
  missing=""

  while IFS= read -r line; do
    [ -z "${line}" ] && continue
    method="${line%% *}"
    route="${line#* }"
    pattern="$(printf '%s' "${route}" | sed -E -e 's/\{[^}]+\}/[^\/]+/g')"
    if grep -qE "^${method} ${pattern}\$" "${recorded_file}"; then
      covered=$((covered + 1))
    else
      missing+="  ${method} ${route}"$'\n'
    fi
  done < "${routes_file}"

  if [ "${total}" -gt 0 ]; then
    pct="$(awk -v c="${covered}" -v t="${total}" 'BEGIN{printf "%.1f", c*100/t}')"
  else
    pct="0.0"
  fi

  echo "================ Parse Server API Coverage ================"
  echo "Phase: ${PARSE_PHASE}"
  echo "Source: $( [ -s "${recorded_file}" ] && echo "recorded test-set or fired-routes log" || echo "(empty)" )"
  echo "Covered ${covered}/${total} routes (${pct}%)"
  if [ -n "${missing}" ]; then
    echo "Uncovered:"
    printf '%s' "${missing}"
  fi
  echo "==========================================================="

  rm -f "${routes_file}" "${recorded_file}"
}

usage() {
  cat <<EOF
Usage: $0 <subcommand> [args]

Subcommands:
  bootstrap [timeout]   wait for /parse/health, sign up the fixed user,
                        capture session token to ${PARSE_TOKEN_FILE}
  record-traffic        drive the broad parse-server REST + GraphQL surface
  coverage              print (method,route) coverage report
  list-routes           print the curated route table

Environment:
  APP_PORT                 host port parse-server is listening on (default 6100)
  PARSE_APP_ID             X-Parse-Application-Id (default keploy-parse-app)
  PARSE_MASTER_KEY         X-Parse-Master-Key (default keploy-parse-master)
  PARSE_MOUNT_PATH         mount path (default /parse)
  PARSE_PHASE              record | replay | <custom> — names the token file slot
  PARSE_FIXED_USERNAME     fixed username for signup (default keploy-user)
  PARSE_FIXED_PASSWORD     fixed password (default KeployPass123!)
  PARSE_FIXED_USER_ID      pinned _User objectId for replay determinism
  PARSE_FIRED_ROUTES_FILE  if set, every fired curl appends "METHOD /path"
EOF
}

main() {
  local cmd="${1:-}"
  if [ -n "${cmd}" ]; then
    shift || true
  fi
  case "${cmd}" in
    bootstrap)      parse_bootstrap "$@" ;;
    record-traffic) parse_record_traffic "$@" ;;
    coverage)       parse_coverage "$@" ;;
    list-routes)    parse_list_routes "$@" ;;
    -h|--help|help|"")
      usage
      [ -z "${cmd}" ] && exit 1
      ;;
    *)
      echo "unknown subcommand: ${cmd}" >&2
      usage >&2
      exit 1
      ;;
  esac
}

main "$@"

#!/usr/bin/env bash
# Subcommand-driven traffic and coverage helper for the parse-server-mongo
# keploy compat lane sample.
#
# Subcommands:
#   bootstrap [timeout]   wait for /parse/health, sign up the fixed user,
#                         capture a session token, persist it under
#                         /tmp/parse-token-${PARSE_PHASE}. Idempotent —
#                         a re-run finds the user there and logs in. Exits 1
#                         when parse-server does not come up, the signup
#                         fails for any other reason, or the login gives no
#                         session for the fixed user.
#   record-traffic        drive the broad parse-server REST + GraphQL
#                         surface that the recording should capture.
#                         Reads the persisted session token, and logs it
#                         out at the end (run bootstrap again before
#                         another record-traffic). Honours
#                         PARSE_FIRED_ROUTES_FILE for fire logging.
#                         Sends every call, then exits 1 listing each call
#                         that did not work, and the session calls it could
#                         not send without a token.
#   coverage              render the JS line coverage from the V8 dumps the
#                         coverage overlay writes (an INFO line and exit 0
#                         without them).
#
# Determinism: the PARSE_FIXED_* env vars pin the objectIds of the user and
# of the objects record-traffic creates by REST, so replay sees stable
# identifiers. The session token and the GraphQL mutation's objectId change
# every run; keploy.yml.template noises them.
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
PARSE_FIXED_ROLE_ID="${PARSE_FIXED_ROLE_ID:-keploy-role-id}"

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

# Calls that did not work, one line each. record-traffic fails at the end
# when there are any.
unexpected=()

# The response body and curl's own error output of the last call sent, read
# for the GraphQL check and quoted when a call did not work. Made by
# fire_files, only for the subcommands that send calls.
FIRE_BODY=""
FIRE_ERR=""
fire_files() {
  [ -n "${FIRE_BODY}" ] && return 0
  FIRE_BODY="$(mktemp)"
  FIRE_ERR="$(mktemp)"
  trap 'rm -f "${FIRE_BODY}" "${FIRE_ERR}"' EXIT
}

# answer_excerpt — the first 200 bytes of the last answer, printable, then
# curl's error if it gave one (a refused or reset connection, an empty reply).
answer_excerpt() {
  local body err
  body="$(head -c 200 "${FIRE_BODY}" | LC_ALL=C tr -c '[:print:]' '.')"
  err="$(head -c 200 "${FIRE_ERR}" | LC_ALL=C tr -c '[:print:]' ' ' | sed 's/ *$//')"
  printf '%s%s' "${body}" "${err:+${body:+ }(${err})}"
}

# fire [--expect CODE] [--graphql] METHOD URL [curl args...] — log the hit,
# send it, and check its HTTP status: any 2xx, or exactly CODE with --expect
# (the calls that probe an error path). With --graphql the answer must also be
# a GraphQL result, a JSON object with a "data" object and no "errors":
# GraphQL reports a failed query or mutation in a 200. Every call is sent
# whatever the earlier ones got back, so a recording still has the whole
# surface; a call that did not work is noted, with the start of its answer,
# not fatal here. Without the check a refused call is still a recorded test:
# a masterKeyIps that refused the master key once turned 46 of these calls
# into recorded 403s, and every keploy lane on this sample stayed green.
fire() {
  local want=2xx graphql=0
  while :; do
    case "$1" in
      --expect) want="$2"; shift 2 ;;
      --graphql) graphql=1; shift ;;
      *) break ;;
    esac
  done
  local method="$1"
  local url="$2"
  shift 2
  log_fired "${method}" "${url}"
  local code why=""
  fire_files
  : > "${FIRE_BODY}"
  code="$(curl -sS -o "${FIRE_BODY}" -w '%{http_code}' -X "${method}" "${url}" "$@" 2>"${FIRE_ERR}" || true)"
  case "${want}:${code}" in
    2xx:2[0-9][0-9] | "${code}:${code}") ;;
    *) why="HTTP ${code:-none}, want ${want}" ;;
  esac
  if [ -z "${why}" ] && [ "${graphql}" = 1 ] &&
    ! jq -e 'type == "object" and (.data | type == "object") and (has("errors") | not)' "${FIRE_BODY}" >/dev/null 2>&1; then
    why="HTTP ${code}, but the answer is not a GraphQL result with data and no errors"
  fi
  if [ -n "${why}" ]; then
    unexpected+=("${method} ${url} -> ${why}: $(answer_excerpt)")
  fi
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
  echo "[flow] timeout waiting for parse-server" >&2
  return 1
}

parse_bootstrap() {
  local timeout="${1:-180}"
  if ! parse_wait_for_health "${timeout}"; then
    : > "${PARSE_TOKEN_FILE}"
    return 1
  fi

  # Give parse-server a beat to finish its boot eager-index sweep so the
  # recording captures pre-mutation find _SCHEMA snapshots before any
  # state mutation lands. Without this, all the find _SCHEMA captures
  # might come AFTER the first user class is inserted, so there's no
  # diverging same-shape candidate set for the matcher's tiebreaker to
  # contend over.
  sleep 3

  local signup_status signup_failed="" login_resp token user_id

  fire_files
  : > "${FIRE_BODY}"
  signup_status="$(curl -sS -o "${FIRE_BODY}" -w '%{http_code}' \
    -X POST "${base}/users" \
    "${h_app[@]}" "${h_json[@]}" \
    --data "{\"objectId\":\"${PARSE_FIXED_USER_ID}\",\"username\":\"${PARSE_FIXED_USERNAME}\",\"password\":\"${PARSE_FIXED_PASSWORD}\",\"email\":\"${PARSE_FIXED_EMAIL}\"}" \
    2>"${FIRE_ERR}" || true)"
  log_fired POST "${base}/users"
  # On a re-run the fixed user is already there, and parse-server answers the
  # signup with 400, code 137 (its objectId is taken; the username and email
  # checks skip the user's own objectId). That is the one failed signup to go
  # on from, and only when the login below gives a session for that user. In
  # the stack keploy records the database is new, so the signup must be a 2xx
  # there; anything else is a broken signup that would be recorded as a test.
  case "${signup_status}" in
    2[0-9][0-9]) echo "[flow] signup ok (HTTP ${signup_status})" ;;
    *)
      signup_failed="HTTP ${signup_status:-none}: $(answer_excerpt)"
      if [ "${signup_status}" != 400 ] || ! jq -e '.code == 137' "${FIRE_BODY}" >/dev/null 2>&1; then
        echo "[flow] signup failed: ${signup_failed}" >&2
        : > "${PARSE_TOKEN_FILE}"
        return 1
      fi
      ;;
  esac

  login_resp="$(curl -sS "${h_app[@]}" \
    "${base}/login?username=$(urlenc "${PARSE_FIXED_USERNAME}")&password=$(urlenc "${PARSE_FIXED_PASSWORD}")" \
    || true)"
  log_fired GET "${base}/login"

  token="$(printf '%s' "${login_resp}" | jq -r '.sessionToken // empty' 2>/dev/null || true)"
  user_id="$(printf '%s' "${login_resp}" | jq -r '.objectId // empty' 2>/dev/null || true)"
  # The login has to give a session for the user with the fixed objectId: every
  # call about the user after it depends on it.
  if [ -z "${token}" ] || [ "${user_id}" != "${PARSE_FIXED_USER_ID}" ]; then
    : > "${PARSE_TOKEN_FILE}"
    [ -n "${signup_failed}" ] && echo "[flow] signup failed: ${signup_failed}" >&2
    echo "[flow] login gave no session for ${PARSE_FIXED_USER_ID}: $(printf '%s' "${login_resp}" | head -c 200 | LC_ALL=C tr -c '[:print:]' '.')" >&2
    return 1
  fi
  [ -n "${signup_failed}" ] && echo "[flow] signup: the user already exists (${signup_failed})"
  printf '%s' "${token}" > "${PARSE_TOKEN_FILE}"
  echo "[flow] session token persisted to ${PARSE_TOKEN_FILE}"
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
  else
    unexpected+=("no session token in ${PARSE_TOKEN_FILE} (run bootstrap first): GET /users/me, PUT /users/${PARSE_FIXED_USER_ID} with the session, GET /sessions/me and POST /logout not sent")
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
  # Three distinct classes widen the divergence window to at least four
  # shapes; the schema calls further down add more.
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
  fire --expect 404 DELETE "${base}/sessions/no-such-session-id" "${h_app[@]}" "${h_master[@]}"

  # ----- Roles: GET, POST, GET ?where (deleted in the cleanup) -----
  fire GET "${base}/roles" "${h_app[@]}" "${h_master[@]}"
  fire POST "${base}/roles" \
    "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" \
    --data "{\"objectId\":\"${PARSE_FIXED_ROLE_ID}\",\"name\":\"keployRole\",\"ACL\":{\"*\":{\"read\":true}},\"users\":{\"__type\":\"Relation\",\"className\":\"_User\"},\"roles\":{\"__type\":\"Relation\",\"className\":\"_Role\"}}"
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
  fire --expect 400 POST "${base}/functions/no-such-fn" \
    "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" --data '{}'
  fire --expect 400 POST "${base}/jobs/no-such-job" \
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
  # A hook is deleted with a PUT of {"__op":"Delete"}; there is no DELETE route.
  fire PUT "${base}/hooks/functions/covFn" \
    "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" \
    --data '{"__op":"Delete"}'
  fire GET "${base}/hooks/triggers" "${h_app[@]}" "${h_master[@]}"

  # ----- GraphQL: query + mutation + introspection -----
  fire --graphql POST "${base}/graphql" \
    "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" \
    --data '{"query":"{ __typename }"}'
  fire --graphql POST "${base}/graphql" \
    "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" \
    --data '{"query":"{ __schema { queryType { name } mutationType { name } } }"}'
  fire --graphql POST "${base}/graphql" \
    "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" \
    --data '{"query":"mutation { createGameScore(input: { fields: { score: 11, playerName: \"gql-1\" } }) { gameScore { objectId score } } }"}'

  # ----- Aggregate (drives AggregateRouter) -----
  local agg_q
  agg_q="$(urlenc '[{"$group":{"_id":"$playerName"}}]')"
  fire GET "${base}/aggregate/GameScore?pipeline=${agg_q}" "${h_app[@]}" "${h_master[@]}"

  # ----- Cleanup: DELETE the objects with fixed ids, so another bootstrap and
  # record-traffic run on the same database (the role's name and objectId are
  # unique). The uploaded files, the GraphQL mutation's GameScore and the
  # sessions stay. -----
  fire DELETE "${base}/roles/${PARSE_FIXED_ROLE_ID}" "${h_app[@]}" "${h_master[@]}"
  fire DELETE "${base}/classes/GameScore/${PARSE_FIXED_SCORE_ID}"     "${h_app[@]}" "${h_master[@]}"
  fire DELETE "${base}/classes/PlayerStats/${PARSE_FIXED_PLAYER_ID}"  "${h_app[@]}" "${h_master[@]}"
  fire DELETE "${base}/classes/Achievement/${PARSE_FIXED_ACHIEVEMENT_ID}" "${h_app[@]}" "${h_master[@]}"

  if [ "${#h_session[@]}" -gt 0 ]; then
    fire POST "${base}/logout" \
      "${h_app[@]}" "${h_session[@]}" "${h_json[@]}" --data '{}'
  fi

  if [ "${#unexpected[@]}" -gt 0 ]; then
    echo "[flow] record-traffic failed (${#unexpected[@]}): each line is a call that did not work, or calls it could not send:" >&2
    printf '[flow]   %s\n' "${unexpected[@]}" >&2
    return 1
  fi
  echo "[flow] record-traffic complete"
}

# parse_coverage (real JS line coverage via NODE_V8_COVERAGE).
#
# Requires the docker-compose.coverage.yml overlay — the base compose
# is uninstrumented so keploy CI lanes (enterprise, integrations) pay
# zero overhead. When called from a base-compose run this function
# detects the missing V8 dumps and exits 0 cleanly so
# `flow.sh coverage || true` informational hooks don't break.
#
# Mechanics:
#   - The overlay sets NODE_V8_COVERAGE=/coverage. V8 emits per-process
#     coverage-<pid>-<ts>.json dumps on clean process exit.
#   - The overlay's coverage-entrypoint.js installs SIGTERM/SIGINT
#     handlers that call process.exit(0) so `compose stop` produces
#     a clean exit (otherwise express's app.listen pins the loop and
#     node would be signal-killed without flushing V8 coverage).
#   - coverage-report.js (in this dir) reads the V8 dumps and emits
#     a `Covered N/M (XX.X%)` line summary plus a coverage-summary.json
#     in c8's shape. We don't use `c8 report` because c8's default
#     filtering excludes node_modules even with --include overrides,
#     and parse-server lives entirely under node_modules/parse-server.
parse_coverage() {
  local app="${PARSE_APP_CONTAINER:-parse-server-mongo-app}"
  local data_dir="${PARSE_COVERAGE_DATA_DIR:-${PWD}/coverage}"
  local report_file="${COVERAGE_REPORT_FILE:-coverage_report.txt}"

  # Detect V8 dumps. If present we treat this as overlay mode.
  if ! ls "${data_dir}"/coverage-*.json >/dev/null 2>&1; then
    echo "INFO: no V8 coverage dumps under ${data_dir} — base image is uninstrumented (apply docker-compose.coverage.yml overlay to enable)"
    : >"${report_file}"
    return 0
  fi

  # Run the report tool inside the coverage image so we have node + the
  # installed source tree at the expected paths.
  local image
  image="${PARSE_COVERAGE_IMAGE:-parse-server-mongo:local-coverage}"
  if ! docker image inspect "${image}" >/dev/null 2>&1; then
    echo "ERROR: coverage report image ${image} not found locally; rebuild via docker-compose.coverage.yml" >&2
    return 1
  fi

  docker run --rm \
    -v "${data_dir}:/coverage" \
    -v "${PWD}/coverage-report.js:/usr/src/app/coverage-report.js:ro" \
    -e NODE_V8_COVERAGE=/coverage \
    -e COVERAGE_INCLUDE="${PARSE_COVERAGE_INCLUDE:-node_modules/parse-server/lib}" \
    -e COVERAGE_REPORT_FILE=/coverage/coverage_report.txt \
    "${image}" \
    sh -c 'cd /usr/src/app && node coverage-report.js'

  if [ -f "${data_dir}/coverage_report.txt" ]; then
    cp "${data_dir}/coverage_report.txt" "${report_file}"
  fi
}

usage() {
  cat <<EOF
Usage: $0 <subcommand> [args]

Subcommands:
  bootstrap [timeout]   wait for /parse/health, sign up the fixed user,
                        capture session token to ${PARSE_TOKEN_FILE};
                        exits 1 when parse-server does not come up, the
                        signup fails (bar the fixed user already being
                        there), or the login gives no session for it
  record-traffic        drive the broad parse-server REST + GraphQL surface,
                        and log the session out; exits 1 listing each call
                        that did not work
  coverage              render the JS line coverage from V8 dumps

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
    -h|--help|help) usage ;;
    "")
      usage >&2
      exit 1
      ;;
    *)
      echo "unknown subcommand: ${cmd}" >&2
      usage >&2
      exit 1
      ;;
  esac
}

main "$@"

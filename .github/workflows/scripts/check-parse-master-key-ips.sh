#!/usr/bin/env bash
# check-parse-master-key-ips.sh: the parse-server-mongo sample takes its master
# key only from the addresses its default masterKeyIps lists, and a master-key
# call it refuses never takes the app down.
#
# It runs the sample's base compose with the default PARSE_MASTER_KEY_IPS
# (loopback and the compose network's subnet), then checks that:
#   1. a master-key call from the docker host through localhost, the address
#      flow.sh and the keploy lanes call from, gets 200;
#   2. a master-key REST call to the host's own non-loopback address, which
#      reaches the app from that address and so from outside the list, gets 403;
#   3. a master-key GraphQL call there gets 403 too. On express 4 this call
#      ended the app: parse-server's async header check refuses the master key
#      by rejecting, and express 4 drops the rejection;
#   4. the app still serves after them: /health answers 200 through localhost,
#      and its container is still running.
# Every check runs; the script exits 1 listing each one that failed.
#
# Run it from parse-server-mongo/. PARSE_CHECK_HOST_IP names the host address
# of checks 2 and 3 (default: the source address of the host's route to the
# internet). PARSE_MASTER_KEY_IPS is ignored: the default is what is checked.
# The stack gets its own project, container and network names, subnet and port
# unless the docker-compose.yml variables for them are set, so it can run
# beside another stack of the sample; it is removed when the script ends.
set -uo pipefail

unset PARSE_MASTER_KEY_IPS
export PARSE_PROJECT="${PARSE_PROJECT:-parse-server-mongo-mkips}"
export PARSE_APP_CONTAINER="${PARSE_APP_CONTAINER:-parse-server-mongo-mkips-app}"
export PARSE_MONGO_CONTAINER="${PARSE_MONGO_CONTAINER:-parse-server-mongo-mkips-mongo}"
export PARSE_NETWORK_NAME="${PARSE_NETWORK_NAME:-parse-server-mongo-mkips-net}"
export PARSE_NETWORK_SUBNET="${PARSE_NETWORK_SUBNET:-172.30.1.0/24}"
case "${PARSE_NETWORK_SUBNET}" in
  *.0/24) net="${PARSE_NETWORK_SUBNET%.0/24}" ;;
  *) net="" ;;
esac
if [ -z "${net}" ] && { [ -z "${PARSE_MONGO_IP:-}" ] || [ -z "${PARSE_APP_IP:-}" ]; }; then
  echo "::error::PARSE_NETWORK_SUBNET ${PARSE_NETWORK_SUBNET} is not an a.b.c.0/24: set PARSE_MONGO_IP and PARSE_APP_IP too" >&2
  exit 2
fi
export PARSE_MONGO_IP="${PARSE_MONGO_IP:-${net}.10}"
export PARSE_APP_IP="${PARSE_APP_IP:-${net}.11}"
export PARSE_DATABASE_URI="${PARSE_DATABASE_URI:-mongodb://${PARSE_MONGO_IP}:27017/parse}"
export PARSE_HOST_PORT="${PARSE_HOST_PORT:-6101}"
export PARSE_CONTAINER_PORT="${PARSE_CONTAINER_PORT:-${PARSE_HOST_PORT}}"
export PARSE_MOUNT_PATH="${PARSE_MOUNT_PATH:-/parse}"
export PARSE_SERVER_URL="${PARSE_SERVER_URL:-http://localhost:${PARSE_HOST_PORT}${PARSE_MOUNT_PATH}}"
export PARSE_APP_ID="${PARSE_APP_ID:-keploy-parse-app}"
export PARSE_MASTER_KEY="${PARSE_MASTER_KEY:-keploy-parse-master}"

host_ip="${PARSE_CHECK_HOST_IP:-$(ip -4 -o route get 1.1.1.1 2>/dev/null | sed -n 's/.* src \([0-9.]*\).*/\1/p')}"
case "${host_ip}" in
  "" | 127.*)
    echo "::error::no non-loopback address of this host to call the app from outside its list: set PARSE_CHECK_HOST_IP" >&2
    exit 2
    ;;
esac

compose=(docker compose -f docker-compose.yml)
body="$(mktemp)"
err="$(mktemp)"
failed=()
done_cleanup=0
cleanup() {
  [ "${done_cleanup}" = 1 ] && return 0
  done_cleanup=1
  if [ "${#failed[@]}" -gt 0 ]; then
    echo "---- parse-server log (tail 60)"
    docker logs --tail 60 "${PARSE_APP_CONTAINER}" 2>&1 || true
  fi
  "${compose[@]}" down -v --remove-orphans >/dev/null 2>&1 || true
  rm -f "${body}" "${err}"
}
trap cleanup EXIT

# call URL [curl args...]: print the HTTP status ("000" when none came).
call() {
  : > "${body}"
  curl -sS --max-time 30 -o "${body}" -w '%{http_code}' "$@" 2>"${err}" || true
}

# expect NAME WANT GOT: note NAME as failed unless GOT is WANT.
expect() {
  if [ "$3" = "$2" ]; then
    echo "ok   $1: HTTP $3"
  else
    failed+=("$1: HTTP $3, want $2: $(head -c 200 "${body}" | LC_ALL=C tr -c '[:print:]' '.') $(head -c 200 "${err}" | LC_ALL=C tr -c '[:print:]' ' ')")
    echo "FAIL ${failed[-1]}"
  fi
}

echo "master-key list (compose): $("${compose[@]}" config 2>/dev/null | sed -n 's/^ *PARSE_SERVER_MASTER_KEY_IPS: *//p')"
"${compose[@]}" up -d --build || { echo "::error::docker compose up failed" >&2; exit 1; }

local_base="http://localhost:${PARSE_HOST_PORT}${PARSE_MOUNT_PATH}"
outside_base="http://${host_ip}:${PARSE_HOST_PORT}${PARSE_MOUNT_PATH}"
app=(-H "X-Parse-Application-Id: ${PARSE_APP_ID}")
master=(-H "X-Parse-Master-Key: ${PARSE_MASTER_KEY}")

up=0
for _ in $(seq 1 120); do
  if [ "$(call "${local_base}/health" "${app[@]}")" = 200 ]; then up=1; break; fi
  sleep 2
done
if [ "${up}" != 1 ]; then
  failed+=("parse-server never answered ${local_base}/health")
  echo "::error::${failed[-1]}" >&2
  exit 1
fi

expect "master key from the docker host (localhost)" 200 \
  "$(call "${local_base}/serverInfo" "${app[@]}" "${master[@]}")"
expect "master key REST call from ${host_ip}" 403 \
  "$(call "${outside_base}/serverInfo" "${app[@]}" "${master[@]}")"
expect "master key GraphQL call from ${host_ip}" 403 \
  "$(call -X POST "${outside_base}/graphql" "${app[@]}" "${master[@]}" \
    -H 'Content-Type: application/json' --data '{"query":"{ health }"}')"
# A crash on an unhandled rejection comes just after the answer, or instead
# of it: give it a moment before asking whether the app is still up.
sleep 2
expect "health after the refused calls" 200 "$(call "${local_base}/health" "${app[@]}")"
running="$(docker inspect -f '{{.State.Running}}' "${PARSE_APP_CONTAINER}" 2>/dev/null || echo missing)"
if [ "${running}" = true ]; then
  echo "ok   parse-server container still running"
else
  failed+=("parse-server container running: ${running}, want true")
  echo "FAIL ${failed[-1]}"
fi
echo "---- parse-server's refusals:"
docker logs "${PARSE_APP_CONTAINER}" 2>&1 | grep -i 'masterKeyIps' | head -n 5 || true

if [ "${#failed[@]}" -gt 0 ]; then
  echo "::error::${#failed[@]} master-key check(s) failed:" >&2
  printf '  %s\n' "${failed[@]}" >&2
  exit 1
fi
echo "all master-key checks passed"

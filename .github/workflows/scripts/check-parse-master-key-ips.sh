#!/usr/bin/env bash
# check-parse-master-key-ips.sh: only the docker host itself gets the
# parse-server-mongo sample's master key, and a master-key call the app refuses
# never takes it down.
#
# 0. index.js's own fallback list, used when PARSE_SERVER_MASTER_KEY_IPS is
#    unset, is loopback only: 127.0.0.1,::1.
# The sample's base compose with its defaults (PARSE_MASTER_KEY_IPS unset):
#   1. its master-key list is loopback and the compose network's subnet, and
#      docker publishes the app's port on the host's 127.0.0.1 only (not on
#      [::1] either: that fails `docker compose up` on a host with IPv6 off);
#   2. a master-key call through 127.0.0.1 gets 200: flow.sh and the keploy
#      lanes call from there;
#   3. each address another host reaches this host at, its IPv4 address and its
#      IPv6 link-local and global addresses (those on the default route's
#      interface), refuses the connection to master-key calls to /serverInfo,
#      /graphql and /schemas: the port is closed there, and even a 403 is a
#      failure. Each address is first shown to take connections from here, on
#      a listener of this script's own, so a refusal is the app's port being
#      closed, not a dead address;
#   4. the app exits 1 when its port is taken, instead of saying it listens.
# Then the app again with PARSE_MASTER_KEY_IPS=127.0.0.1,::1: docker relays the
# docker host's own calls from the compose network's gateway, so without the
# subnet in the list they are refused:
#   5. a master-key REST call and a GraphQL call through 127.0.0.1 get 403. On
#      express 4 the GraphQL call ended the app: parse-server's async header
#      check refuses the master key by rejecting, and express 4 drops the
#      rejection;
#   6. the app still serves after them: /health answers 200, and its container
#      is still running.
# Every check runs; the script exits 1 listing each one that failed.
#
# Run it from parse-server-mongo/. It needs docker, curl, ip and python3.
# PARSE_CHECK_HOST_IP names the IPv4 address of check 3 (default: the source
# address of the host's route to the internet), and PARSE_CHECK_HOST_IP6 its
# IPv6 addresses, space-separated, a link-local one with its %zone (default:
# the link-local and the global address of that route's interface; none: the
# IPv6 calls are not made, and the script says so). PARSE_MASTER_KEY_IPS is
# ignored. The stack gets its own project, container and network names, subnet
# and port unless the docker-compose.yml variables for them are set, so it can
# run beside another stack of the sample; it is removed when the script ends.
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
# parse-server's serverURL, read inside the app's container: localhost there is
# the container itself. Every call this script makes goes to 127.0.0.1.
export PARSE_SERVER_URL="${PARSE_SERVER_URL:-http://localhost:${PARSE_CONTAINER_PORT}${PARSE_MOUNT_PATH}}"
export PARSE_APP_ID="${PARSE_APP_ID:-keploy-parse-app}"
export PARSE_MASTER_KEY="${PARSE_MASTER_KEY:-keploy-parse-master}"
export PARSE_IMAGE="${PARSE_IMAGE:-parse-server-mongo:local}"

route="$(ip -4 -o route get 1.1.1.1 2>/dev/null)"
host_ip="${PARSE_CHECK_HOST_IP:-$(sed -n 's/.* src \([0-9.]*\).*/\1/p' <<<"${route}")}"
case "${host_ip}" in
  "" | 127.*)
    echo "::error::no non-loopback IPv4 address of this host to call the app at as another host would: set PARSE_CHECK_HOST_IP" >&2
    exit 2
    ;;
esac
if [ -n "${PARSE_CHECK_HOST_IP6+set}" ]; then
  read -r -a host_ip6 <<<"${PARSE_CHECK_HOST_IP6}"
else
  host_ip6=()
  dev="$(sed -n 's/.* dev \([^ ]*\).*/\1/p' <<<"${route}")"
  if [ -n "${dev}" ]; then
    a="$(ip -6 -o addr show dev "${dev}" scope link 2>/dev/null | awk '{print $4; exit}')"
    [ -n "${a}" ] && host_ip6+=("${a%/*}%${dev}")
    a="$(ip -6 -o addr show dev "${dev}" scope global 2>/dev/null | awk '{print $4; exit}')"
    [ -n "${a}" ] && host_ip6+=("${a%/*}")
  fi
fi

compose=(docker compose -f docker-compose.yml)
tmp="$(mktemp -d)"
body="${tmp}/body"
err="${tmp}/err"
failed=()
listener_pid=""
done_cleanup=0
# shellcheck disable=SC2329 # run by the EXIT trap below
cleanup() {
  [ "${done_cleanup}" = 1 ] && return 0
  done_cleanup=1
  [ -n "${listener_pid}" ] && kill "${listener_pid}" 2>/dev/null
  if [ "${#failed[@]}" -gt 0 ]; then
    echo "---- parse-server log (tail 60)"
    docker logs --tail 60 "${PARSE_APP_CONTAINER}" 2>&1 || true
  fi
  docker rm -f "${PARSE_APP_CONTAINER}-portcheck" >/dev/null 2>&1 || true
  "${compose[@]}" down -v --remove-orphans >/dev/null 2>&1 || true
  rm -rf "${tmp}"
}
trap cleanup EXIT

fail() {
  failed+=("$1")
  echo "FAIL $1"
}

# url HOST: the app's base URL at HOST, an IPv6 one in brackets with its %zone
# escaped as URLs write it.
url() {
  case "$1" in
    *:*) local h="${1//%/%25}"; echo "http://[${h}]:${PARSE_HOST_PORT}${PARSE_MOUNT_PATH}" ;;
    *) echo "http://$1:${PARSE_HOST_PORT}${PARSE_MOUNT_PATH}" ;;
  esac
}

# call URL [curl args...]: print the HTTP status ("000" when none came); curl's
# exit status goes to ${tmp}/rc.
call() {
  : > "${body}"
  curl -g -sS --max-time 30 -o "${body}" -w '%{http_code}' "$@" 2>"${err}"
  echo "$?" > "${tmp}/rc"
}

why() {
  echo "$(head -c 200 "${body}" | LC_ALL=C tr -c '[:print:]' '.') $(head -c 200 "${err}" | LC_ALL=C tr -c '[:print:]' ' ')"
}

# expect NAME WANT GOT: note NAME as failed unless GOT is WANT.
expect() {
  if [ "$3" = "$2" ]; then
    echo "ok   $1: HTTP $3"
  else
    fail "$1: HTTP $3, want $2: $(why)"
  fi
}

# closed NAME URL [curl args...]: the call must be refused at the connection
# (curl exit 7): the port is closed there. An answer of any kind, a 403
# included, means the app is published beyond 127.0.0.1.
closed() {
  local name="$1" code rc
  shift
  code="$(call "$@")"
  rc="$(cat "${tmp}/rc")"
  if [ "${rc}" = 7 ]; then
    echo "ok   ${name}: connection refused"
  else
    fail "${name}: HTTP ${code} (curl exit ${rc}), want a refused connection: $(why)"
  fi
}

# reachable HOST: HOST takes connections from here, on a listener of our own.
reachable() {
  local port="" code
  # Emptied here, before the listener starts: its own `>` runs in the
  # background, and the last listener's port must not be read for this one.
  : > "${tmp}/lport"
  python3 -u -c '
import socket, sys
ai = socket.getaddrinfo(sys.argv[1], 0, type=socket.SOCK_STREAM, flags=socket.AI_PASSIVE)[0]
s = socket.socket(ai[0], socket.SOCK_STREAM)
s.bind(ai[4])
s.listen(8)
print(s.getsockname()[1])
sys.stdout.flush()
s.settimeout(60)
while True:
    c, _ = s.accept()
    c.recv(4096)
    c.sendall(b"HTTP/1.0 200 OK\r\nContent-Length: 2\r\n\r\nok")
    c.close()
' "$1" > "${tmp}/lport" 2>"${tmp}/lerr" &
  listener_pid=$!
  for _ in $(seq 1 50); do
    port="$(head -n 1 "${tmp}/lport")"
    [ -n "${port}" ] && break
    sleep 0.1
  done
  case "$1" in
    *:*) code="$(curl -g -s --max-time 10 -o /dev/null -w '%{http_code}' "http://[${1//%/%25}]:${port:-0}/")" ;;
    *) code="$(curl -g -s --max-time 10 -o /dev/null -w '%{http_code}' "http://$1:${port:-0}/")" ;;
  esac
  kill "${listener_pid}" 2>/dev/null
  wait "${listener_pid}" 2>/dev/null
  listener_pid=""
  if [ "${code}" = 200 ]; then
    echo "ok   $1 takes connections from here (a listener of our own on port ${port})"
    return 0
  fi
  fail "$1 takes no connection from here, even on a listener of our own (HTTP ${code}): $(head -c 200 "${tmp}/lerr" | LC_ALL=C tr -c '[:print:]' ' ')"
  return 1
}

# wait_health: the app answers /health through 127.0.0.1.
wait_health() {
  local _
  for _ in $(seq 1 120); do
    [ "$(call "$(url 127.0.0.1)/health" "${app[@]}")" = 200 ] && return 0
    sleep 2
  done
  fail "parse-server never answered $(url 127.0.0.1)/health"
  return 1
}

finish() {
  if [ "${#failed[@]}" -gt 0 ]; then
    echo "::error::${#failed[@]} master-key check(s) failed:" >&2
    printf '  %s\n' "${failed[@]}" >&2
    exit 1
  fi
  echo "all master-key checks passed"
  exit 0
}

app=(-H "X-Parse-Application-Id: ${PARSE_APP_ID}")
master=(-H "X-Parse-Master-Key: ${PARSE_MASTER_KEY}")
gql=(-X POST -H 'Content-Type: application/json' --data '{"query":"{ health }"}')

# ---- 0
if grep -Fq "process.env.PARSE_SERVER_MASTER_KEY_IPS || '127.0.0.1,::1'" index.js; then
  echo "ok   index.js's fallback list is 127.0.0.1,::1"
else
  fail "index.js's fallback list is not 127.0.0.1,::1: $(grep -n 'MASTER_KEY_IPS' index.js | tr '\n' ' ')"
fi

# ---- 1-4: the defaults
list="$("${compose[@]}" config 2>/dev/null | sed -n 's/^ *PARSE_SERVER_MASTER_KEY_IPS: *//p')"
expect_list="127.0.0.1,::1,${PARSE_NETWORK_SUBNET}"
if [ "${list}" = "${expect_list}" ]; then
  echo "ok   compose's default master-key list is ${list}"
else
  fail "compose's default master-key list is '${list}', want '${expect_list}'"
fi
"${compose[@]}" up -d --build || { echo "::error::docker compose up failed" >&2; exit 1; }
wait_health || finish

published="$(docker port "${PARSE_APP_CONTAINER}" 2>&1)"
echo "published: $(tr '\n' ' ' <<<"${published}")"
open="$(grep -v -E -e "-> 127\.0\.0\.1:${PARSE_HOST_PORT}\$" <<<"${published}")"
if [ -n "${published}" ] && [ -z "${open}" ]; then
  echo "ok   the port is published on 127.0.0.1 only"
else
  fail "the port is published beyond 127.0.0.1: $(tr '\n' ' ' <<<"${open:-nothing published}")"
fi

expect "master key through 127.0.0.1" 200 "$(call "$(url 127.0.0.1)/serverInfo" "${app[@]}" "${master[@]}")"

[ "${#host_ip6[@]}" -gt 0 ] || echo "note no IPv6 address on the default route's interface: the IPv6 calls of check 3 are not made"
for h in "${host_ip}" "${host_ip6[@]}"; do
  reachable "${h}" || continue
  closed "master key REST /serverInfo at ${h}" "$(url "${h}")/serverInfo" "${app[@]}" "${master[@]}"
  closed "master key GraphQL at ${h}" "$(url "${h}")/graphql" "${app[@]}" "${master[@]}" "${gql[@]}"
  closed "master key REST /schemas at ${h}" "$(url "${h}")/schemas" "${app[@]}" "${master[@]}"
done

# The app's image, the compose network and its mongo, with the port already
# taken in the container when index.js starts.
docker run -d --name "${PARSE_APP_CONTAINER}-portcheck" --network "${PARSE_NETWORK_NAME}" \
  -e PORT="${PARSE_CONTAINER_PORT}" -e PARSE_SERVER_DATABASE_URI="${PARSE_DATABASE_URI}" \
  --entrypoint sh "${PARSE_IMAGE}" -c \
  'node -e "require(\"net\").createServer().listen(process.env.PORT)" & sleep 2; exec node index.js' >/dev/null
state=running
for _ in $(seq 1 45); do
  state="$(docker inspect -f '{{.State.Status}} {{.State.ExitCode}}' "${PARSE_APP_CONTAINER}-portcheck" 2>&1)"
  case "${state}" in running*) sleep 2 ;; *) break ;; esac
done
plog="$(docker logs "${PARSE_APP_CONTAINER}-portcheck" 2>&1)"
if [ "${state}" = "exited 1" ] && ! grep -q 'listening on' <<<"${plog}"; then
  echo "ok   with its port taken the app exits 1"
else
  fail "with its port taken the app is '${state}', want 'exited 1' and no 'listening on' line: $(tail -n 3 <<<"${plog}" | tr '\n' ' ' | cut -c1-300)"
fi
docker rm -f "${PARSE_APP_CONTAINER}-portcheck" >/dev/null 2>&1

# ---- 5-6: the host's own calls refused
export PARSE_MASTER_KEY_IPS=127.0.0.1,::1
echo "master-key list now: ${PARSE_MASTER_KEY_IPS}"
"${compose[@]}" up -d --no-build --no-deps parse-server || { echo "::error::docker compose up of the app with PARSE_MASTER_KEY_IPS=${PARSE_MASTER_KEY_IPS} failed" >&2; exit 1; }
wait_health || finish
expect "master key REST call from the docker host, outside the list" 403 \
  "$(call "$(url 127.0.0.1)/serverInfo" "${app[@]}" "${master[@]}")"
expect "master key GraphQL call from the docker host, outside the list" 403 \
  "$(call "$(url 127.0.0.1)/graphql" "${app[@]}" "${master[@]}" "${gql[@]}")"
# A crash on an unhandled rejection comes just after the answer, or instead
# of it: give it a moment before asking whether the app is still up.
sleep 2
expect "health after the refused calls" 200 "$(call "$(url 127.0.0.1)/health" "${app[@]}")"
running="$(docker inspect -f '{{.State.Running}}' "${PARSE_APP_CONTAINER}" 2>/dev/null || echo missing)"
if [ "${running}" = true ]; then
  echo "ok   parse-server container still running"
else
  fail "parse-server container running: ${running}, want true"
fi
echo "---- parse-server's refusals:"
docker logs "${PARSE_APP_CONTAINER}" 2>&1 | grep -i 'masterKeyIps' | head -n 5 || true

finish

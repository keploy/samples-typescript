#!/usr/bin/env bash
# check-parse-flow-health-wait.sh: `flow.sh bootstrap TIMEOUT` waits for
# parse-server's /health for TIMEOUT seconds of wall clock, no longer, even
# against a server that takes connections and never answers.
#
# It starts such a server on loopback (python3: a socket that listens and never
# accepts, so the kernel completes each connection and no answer comes), and
# checks that flow.sh exits 1 and says it timed out, within the timeout, the
# last 1 s sleep and some start-up:
#   - `bootstrap 2` within 4.5 s: a try that is not cut at the deadline (each
#     may take up to 5 s) ends it after 6 s or more;
#   - `bootstrap 6` within 8.5 s: its 5 s try and 1 s sleep leave no time at
#     the next check, and a try made then (curl's --max-time 0) never ends.
#
# Run it from parse-server-mongo/. It needs no docker.
set -uo pipefail

tmp="$(mktemp -d)"
server_pid=""
cleanup() {
  [ -n "${server_pid}" ] && kill "${server_pid}" 2>/dev/null
  rm -rf "${tmp}"
}
trap cleanup EXIT

python3 -u -c '
import socket, sys, time
s = socket.socket()
s.bind(("127.0.0.1", 0))
s.listen(64)
print(s.getsockname()[1])
sys.stdout.flush()
time.sleep(600)
' > "${tmp}/port" &
server_pid=$!
for _ in $(seq 1 50); do
  [ -s "${tmp}/port" ] && break
  sleep 0.1
done
port="$(head -n 1 "${tmp}/port")"
if [ -z "${port}" ]; then
  echo "::error::the silent server never started" >&2
  exit 1
fi

failed=0
# wait_bound TIMEOUT MAX_MS: flow.sh bootstrap TIMEOUT exits 1, says it timed
# out, and ends within MAX_MS.
wait_bound() {
  local start rc ms bad=0
  start="$(date +%s%N)"
  APP_PORT="${port}" PARSE_TOKEN_FILE="${tmp}/token" PARSE_FIRED_ROUTES_FILE="${tmp}/fired" \
    timeout 30 bash flow.sh bootstrap "$1" > "${tmp}/out" 2>&1
  rc=$?
  ms=$(( ($(date +%s%N) - start) / 1000000 ))
  sed 's/^/    /' "${tmp}/out"
  echo "flow.sh bootstrap $1 against a server that never answers: exit ${rc} after ${ms} ms"
  if [ "${rc}" != 1 ]; then
    echo "FAIL bootstrap $1: exit ${rc}, want 1 (124: still waiting after 30 s)"
    bad=1
  fi
  if ! grep -q 'timeout waiting for parse-server' "${tmp}/out"; then
    echo "FAIL bootstrap $1: flow.sh did not say it timed out"
    bad=1
  fi
  if [ "${ms}" -gt "$2" ]; then
    echo "FAIL bootstrap $1: the wait took ${ms} ms, want at most $2"
    bad=1
  fi
  [ "${bad}" = 0 ] && echo "ok   bootstrap $1: the health wait ended on its deadline"
  [ "${bad}" = 0 ] || failed=1
}
wait_bound 2 4500
wait_bound 6 8500
if [ "${failed}" != 0 ]; then
  echo "::error::flow.sh's health wait is not bounded by its timeout" >&2
  exit 1
fi
echo "ok   flow.sh's health wait ends on its deadline"

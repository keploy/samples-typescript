#!/usr/bin/env bash
# Minimum reproducer traffic for the mongo/v2 boot-phase tiebreaker bug.
#
# Three calls produce the chronology divergence the lane needs:
#   1. POST /parse/users (signup) — drives parse-server's boot find _SCHEMA
#      sweep + insert _SCHEMA for system classes (_User, _Role, _Session, ...).
#      All these mocks land before the user-defined class exists in _SCHEMA.
#   2. POST /parse/classes/GameScore — parse-server lazily inserts the
#      user-defined class into _SCHEMA AFTER its initial boot sweep,
#      mutating state mid-recording. From this point onward, find _SCHEMA
#      responses include GameScore.
#   3. GET /parse/classes/GameScore/<id> — exercises the post-mutation
#      state so the recording captures find _SCHEMA mocks with the
#      diverged response shape.
#
# At replay, the boot-phase matcher's score-tied tiebreaker decides which
# of the multiple same-shape find _SCHEMA mocks wins. Without the fix, it
# picks the latest (post-GameScore-insertion); the booting app sees the
# user class in _SCHEMA, runs `listIndexes <user-class>` (never recorded),
# and dies with MongoNetworkError. With the fix, it picks the earliest
# (pre-insertion); parse-server processes only system classes at boot,
# the recorded follow-on queries match, and the app boots cleanly.

set -Eeuo pipefail

APP_PORT="${APP_PORT:-6100}"
APP_ID="${PARSE_SERVER_APPLICATION_ID:-keploy-parse-app}"
MASTER_KEY="${PARSE_SERVER_MASTER_KEY:-keploy-parse-master}"
USER_ID="${USER_ID:-keploy-user-id}"
SCORE_ID="${SCORE_ID:-keploy-score-id}"

base="http://localhost:${APP_PORT}/parse"
h_app=(-H "X-Parse-Application-Id: ${APP_ID}")
h_master=(-H "X-Parse-Master-Key: ${MASTER_KEY}")
h_json=(-H "Content-Type: application/json")

echo "[flow] waiting for parse-server to come up..."
for i in $(seq 1 180); do
  if curl -fsS "${h_app[@]}" "${base}/health" >/dev/null 2>&1; then
    echo "[flow] parse-server reachable"
    break
  fi
  sleep 1
done

curl -fsS -X POST "${h_app[@]}" "${h_json[@]}" "${base}/users" \
  --data "{\"objectId\":\"${USER_ID}\",\"username\":\"keploy-user\",\"password\":\"KeployPass123!\",\"email\":\"keploy@example.com\"}" \
  >/dev/null
echo "[flow] signup ok"

curl -fsS -X POST "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" "${base}/classes/GameScore" \
  --data "{\"objectId\":\"${SCORE_ID}\",\"score\":10,\"playerName\":\"keploy-user\"}" \
  >/dev/null
echo "[flow] GameScore POST ok"

curl -fsS "${h_app[@]}" "${h_master[@]}" "${base}/classes/GameScore/${SCORE_ID}" \
  >/dev/null
echo "[flow] GameScore GET ok"

echo "[flow] complete"

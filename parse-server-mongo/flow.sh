#!/usr/bin/env bash
# Reproducer traffic for the mongo/v2 boot-phase tiebreaker bug.
#
# What the bug needs to surface:
#   - The recording captures multiple same-shape `find _SCHEMA filter:{}`
#     mocks at boot, with diverging responses. Early ones see only
#     system classes (_User, _Role, _Session, ...); later ones see
#     user-defined classes Parse Server lazily added during traffic.
#   - At replay, the matcher's score-tied tiebreaker picks ONE of those
#     same-shape mocks. The unfixed tiebreaker biases toward the latest
#     (with user classes), which steers a booting app onto a steady-
#     state code path and runs `listIndexes <user-class>` for classes
#     the boot phase didn't witness — surfacing as a downstream cascade
#     mock-miss.
#
# To reliably trigger that divergence we (a) give Parse Server time to
# complete its eager-index sweep before any HTTP test fires, and
# (b) drive several class-mutating calls that each cause Parse Server
# to refresh its schema cache and capture a new post-mutation
# `find _SCHEMA` mock. The flow exercises three user classes
# (GameScore, PlayerStats, Achievement) so the divergence window is
# wide enough that even a one-off boot probe at replay will pick one
# of the post-mutation mocks under the unfixed tiebreaker.

set -Eeuo pipefail

APP_PORT="${APP_PORT:-6100}"
APP_ID="${PARSE_SERVER_APPLICATION_ID:-keploy-parse-app}"
MASTER_KEY="${PARSE_SERVER_MASTER_KEY:-keploy-parse-master}"
USER_ID="${USER_ID:-keploy-user-id}"
USERNAME="${USERNAME:-keploy-user}"
PASSWORD="${PASSWORD:-KeployPass123!}"
EMAIL="${EMAIL:-keploy@example.com}"
SCORE_ID="${SCORE_ID:-keploy-score-id}"
PLAYER_ID="${PLAYER_ID:-keploy-player-id}"
ACHIEVEMENT_ID="${ACHIEVEMENT_ID:-keploy-achievement-id}"

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

# Give Parse Server a beat to finish its boot eager-index sweep so the
# recording captures multiple pre-mutation find _SCHEMA snapshots
# before any state mutation lands. Without this, all the find _SCHEMA
# captures might come AFTER the first user class is inserted, so
# there's no diverging same-shape candidate set for the matcher's
# tiebreaker to contend over.
sleep 3

# --- Tier 1: read-only probes (no _SCHEMA mutation, but each handler
# may cause Parse Server to refresh its schema cache, capturing more
# pre-mutation find _SCHEMA snapshots) ---

curl -fsS "${h_app[@]}" "${base}/health"      >/dev/null
curl -fsS "${h_app[@]}" "${h_master[@]}" "${base}/serverInfo" >/dev/null
curl -fsS "${h_app[@]}" "${h_master[@]}" "${base}/config"     >/dev/null
curl -fsS "${h_app[@]}" "${h_master[@]}" "${base}/schemas"    >/dev/null
echo "[flow] tier 1 (read-only probes) done"

# --- Tier 2: signup + login (mutates _Session but not user classes) ---

curl -fsS -X POST "${h_app[@]}" "${h_json[@]}" "${base}/users" \
  --data "{\"objectId\":\"${USER_ID}\",\"username\":\"${USERNAME}\",\"password\":\"${PASSWORD}\",\"email\":\"${EMAIL}\"}" \
  >/dev/null
echo "[flow] signup ok"

curl -fsS "${h_app[@]}" "${base}/login?username=${USERNAME}&password=${PASSWORD}" >/dev/null
echo "[flow] login ok"

# --- Tier 3: user-class mutations. Each `POST /classes/<NewClass>`
# triggers Parse Server to insert the class into _SCHEMA, refresh
# its schema cache, and run listIndexes on the new collection. The
# subsequent find _SCHEMA captures will include the newly-added
# class. After three different classes, the recording's find
# _SCHEMA mocks span four distinct response shapes. ---

curl -fsS -X POST "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" "${base}/classes/GameScore" \
  --data "{\"objectId\":\"${SCORE_ID}\",\"score\":10,\"playerName\":\"${USERNAME}\"}" \
  >/dev/null
echo "[flow] GameScore POST ok"

curl -fsS -X POST "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" "${base}/classes/PlayerStats" \
  --data "{\"objectId\":\"${PLAYER_ID}\",\"level\":1,\"xp\":100,\"playerName\":\"${USERNAME}\"}" \
  >/dev/null
echo "[flow] PlayerStats POST ok"

curl -fsS -X POST "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" "${base}/classes/Achievement" \
  --data "{\"objectId\":\"${ACHIEVEMENT_ID}\",\"name\":\"first-class\",\"unlocked\":true}" \
  >/dev/null
echo "[flow] Achievement POST ok"

# --- Tier 4: read-after-mutation. Each call may cause Parse Server
# to consult its schema cache (recently invalidated by the inserts
# above), capturing more post-mutation find _SCHEMA mocks. ---

curl -fsS "${h_app[@]}" "${h_master[@]}" "${base}/classes/GameScore/${SCORE_ID}"     >/dev/null
curl -fsS "${h_app[@]}" "${h_master[@]}" "${base}/classes/PlayerStats/${PLAYER_ID}"  >/dev/null
curl -fsS "${h_app[@]}" "${h_master[@]}" "${base}/classes/Achievement/${ACHIEVEMENT_ID}" >/dev/null
curl -fsS -X PUT "${h_app[@]}" "${h_master[@]}" "${h_json[@]}" "${base}/classes/GameScore/${SCORE_ID}" \
  --data '{"score":99}' >/dev/null
curl -fsS "${h_app[@]}" "${h_master[@]}" "${base}/schemas"                           >/dev/null
curl -fsS "${h_app[@]}" "${h_master[@]}" "${base}/schemas/GameScore"                 >/dev/null
echo "[flow] tier 4 (read-after-mutation) done"

echo "[flow] complete"

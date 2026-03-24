#!/bin/bash
set -euo pipefail

APP_URL="${APP_URL:-http://localhost:30081}"

echo "Using APP_URL=${APP_URL}"

run() {
  local scenario="$1"
  local path="$2"
  echo
  echo "==> ${scenario}"
  curl -fsS "${APP_URL}${path}"
  echo
}

run "deps-http" "/deps/http"
run "deps-http2" "/deps/http2"
run "deps-grpc" "/deps/grpc"
run "deps-mysql" "/deps/mysql"
run "deps-postgres" "/deps/postgres"
run "deps-mongo" "/deps/mongo"
run "deps-redis" "/deps/redis"
run "deps-kafka" "/deps/kafka"
run "deps-sqs" "/deps/sqs"
run "deps-generic" "/deps/generic"
run "dedup-alpha-1" "/dedup/catalog?id=alpha"
run "dedup-alpha-2" "/dedup/catalog?id=alpha"
run "dedup-alpha-3" "/dedup/catalog?id=alpha"
run "dedup-beta-1" "/dedup/catalog?id=beta"
run "dedup-beta-2" "/dedup/catalog?id=beta"
run "noise-runtime" "/noise/runtime"
run "expected-fail-time-window" "/expected-fail/time-window?ts=$(date +%s)"

#!/bin/bash
set -euo pipefail

APP_URL="${APP_URL:-http://localhost:30081}"

echo "Using APP_URL=${APP_URL}"

curl -fsS "${APP_URL}/deps/http"
curl -fsS "${APP_URL}/deps/http2"
curl -fsS "${APP_URL}/deps/grpc"
curl -fsS "${APP_URL}/deps/mysql"
curl -fsS "${APP_URL}/deps/postgres"
curl -fsS "${APP_URL}/deps/mongo"
curl -fsS "${APP_URL}/deps/redis"
curl -fsS "${APP_URL}/deps/kafka"
curl -fsS "${APP_URL}/deps/sqs"
curl -fsS "${APP_URL}/deps/generic"
curl -fsS "${APP_URL}/dedup/catalog?id=alpha"
curl -fsS "${APP_URL}/dedup/catalog?id=alpha"
curl -fsS "${APP_URL}/dedup/catalog?id=alpha"
curl -fsS "${APP_URL}/dedup/catalog?id=beta"
curl -fsS "${APP_URL}/dedup/catalog?id=beta"
curl -fsS "${APP_URL}/noise/runtime"
curl -fsS "${APP_URL}/expected-fail/time-window?ts=$(date +%s)"

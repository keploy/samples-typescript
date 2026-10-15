#!/bin/bash
set -euo pipefail

APP_URL="${APP_URL:-http://localhost:30081}"

echo "Using APP_URL=${APP_URL}"

show_recording_hint() {
  cat >&2 <<'EOF'
Hint: if this target is a Keploy-hosted recording pod in Kubernetes, send sample traffic through port-forward instead of the app NodePorts:
  kubectl -n default port-forward svc/node-dependency-matrix 8080:8080 9090:9090
  APP_URL=http://localhost:8080 bash scripts/record_traffic.sh
EOF
}

preflight() {
  local expectations_status
  expectations_status="$(curl -sS -o /dev/null -w '%{http_code}' "${APP_URL}/expectations" || true)"
  if [[ "${expectations_status}" == "200" ]]; then
    return
  fi

  echo "Preflight failed: ${APP_URL}/expectations returned ${expectations_status:-connection-error}." >&2
  if [[ "${APP_URL}" =~ localhost:(30081|31081)$ ]]; then
    show_recording_hint
  fi
  exit 1
}

run() {
  local scenario="$1"
  local path="$2"
  echo
  echo "==> ${scenario}"
  curl -fsS "${APP_URL}${path}"
  echo
}

post_json() {
  local scenario="$1"
  local path="$2"
  local body="$3"
  shift 3
  echo
  echo "==> ${scenario}"
  curl -fsS -X POST "${APP_URL}${path}" -H "content-type: application/json" "$@" --data "${body}"
  echo
}

preflight

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
post_json "dedup-order-alpha-1" "/dedup/order" '{"customerTier":"gold","items":[{"quantity":2,"sku":"sku-2"},{"sku":"sku-1","quantity":1}],"orderId":"order-alpha"}' -H "x-matrix-dedup-key: order-alpha"
post_json "dedup-order-alpha-2" "/dedup/order" '{"orderId":"order-alpha","items":[{"sku":"sku-1","quantity":1},{"sku":"sku-2","quantity":2}],"customerTier":"gold"}' -H "x-matrix-dedup-key: order-alpha"
post_json "dedup-order-alpha-3" "/dedup/order" '{"items":[{"sku":"sku-2","quantity":2},{"quantity":1,"sku":"sku-1"}],"customerTier":"gold","orderId":"order-alpha"}' -H "x-matrix-dedup-key: order-alpha"
post_json "dedup-order-beta-1" "/dedup/order" '{"customerTier":"silver","items":[{"sku":"sku-3","quantity":1}],"orderId":"order-beta"}' -H "x-matrix-dedup-key: order-beta"
post_json "async-catalog-sync-start" "/async/catalog-sync" '{"jobId":"sync-alpha","catalogId":"alpha"}' -H "x-matrix-correlation-id: sync-alpha"
run "async-catalog-sync-wait" "/async/catalog-sync/sync-alpha/wait?timeoutMs=5000"
run "noise-runtime" "/noise/runtime"
run "expected-fail-time-window" "/expected-fail/time-window?ts=$(date +%s)"

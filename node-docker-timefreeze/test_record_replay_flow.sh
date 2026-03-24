#!/bin/bash

set -euo pipefail

APP_URL="${APP_URL:-http://localhost:30081}"

echo "Using app URL: ${APP_URL}"

LOGIN_RESPONSE=$(curl -fsS -X POST "${APP_URL}/login")
TOKEN=$(printf '%s' "${LOGIN_RESPONSE}" | node -e "let s='';process.stdin.on('data', d => s += d).on('end', () => console.log(JSON.parse(s).token))")

echo "Calling /protected"
curl -fsS "${APP_URL}/protected" \
  -H "Authorization: Bearer ${TOKEN}"
echo

echo "Calling /check-time"
APP_URL="${APP_URL}" ./test_time_endpoint.sh

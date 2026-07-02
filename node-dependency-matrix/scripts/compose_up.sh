#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

bash "${ROOT_DIR}/scripts/generate_certs.sh" "${ROOT_DIR}/.generated/certs"

docker compose -f "${ROOT_DIR}/compose.yaml" up --build -d "$@"

echo ""
echo "Compose app HTTP: http://localhost:${APP_HTTP_PORT:-38081}"
echo "Compose app gRPC: localhost:${APP_GRPC_PORT:-39090}"

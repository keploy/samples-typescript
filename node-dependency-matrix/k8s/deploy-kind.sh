#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLUSTER_NAME="${KIND_CLUSTER_NAME:-node-dependency-matrix}"
KIND_CONTEXT="kind-${CLUSTER_NAME}"
KUBECTL=(kubectl --context "${KIND_CONTEXT}")
IMAGE_NAME="${IMAGE_NAME:-node-dependency-matrix:latest}"
CERT_DIR="${ROOT_DIR}/.generated/certs"
HOST_PROXY_PORT="${HOST_PROXY_PORT:-30080}"
HOST_APP_PORT="${HOST_APP_PORT:-30081}"
HOST_GRPC_PORT="${HOST_GRPC_PORT:-30090}"
KEPLOY_INGRESS_URL="${KEPLOY_INGRESS_URL:-}"
KEPLOY_INGRESS_HOST="${KEPLOY_INGRESS_HOST:-localhost}"
KEPLOY_INGRESS_SCHEME="${KEPLOY_INGRESS_SCHEME:-}"
SKIP_DEPENDENCY_PULLS="${SKIP_DEPENDENCY_PULLS:-0}"

DEPENDENCY_IMAGES=(
  "mysql:8.0"
  "postgres:16"
  "mongo:7"
  "redis:7-alpine"
  "docker.redpanda.com/redpandadata/redpanda:v25.1.2"
  "localstack/localstack:3.3"
)

if ! kind get clusters | grep -qx "${CLUSTER_NAME}"; then
  TMP_KIND_CONFIG="$(mktemp)"
  cat > "${TMP_KIND_CONFIG}" <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 30080
        hostPort: ${HOST_PROXY_PORT}
        protocol: TCP
      - containerPort: 30081
        hostPort: ${HOST_APP_PORT}
        protocol: TCP
      - containerPort: 30090
        hostPort: ${HOST_GRPC_PORT}
        protocol: TCP
EOF
  kind create cluster --name "${CLUSTER_NAME}" --config "${TMP_KIND_CONFIG}"
  rm -f "${TMP_KIND_CONFIG}"
fi

bash "${ROOT_DIR}/scripts/generate_certs.sh" "${CERT_DIR}"

if [[ "${SKIP_DEPENDENCY_PULLS}" != "1" ]]; then
  for dep_image in "${DEPENDENCY_IMAGES[@]}"; do
    docker exec "${CLUSTER_NAME}-control-plane" crictl pull "${dep_image}"
  done
fi

docker build --pull=false -t "${IMAGE_NAME}" "${ROOT_DIR}"
kind load docker-image "${IMAGE_NAME}" --name "${CLUSTER_NAME}"

"${KUBECTL[@]}" delete secret node-dependency-matrix-tls --ignore-not-found=true
"${KUBECTL[@]}" create secret generic node-dependency-matrix-tls \
  --from-file=ca.crt="${CERT_DIR}/ca.crt" \
  --from-file=proxy.crt="${CERT_DIR}/proxy.crt" \
  --from-file=proxy-fullchain.crt="${CERT_DIR}/proxy-fullchain.crt" \
  --from-file=proxy.key="${CERT_DIR}/proxy.key"

"${KUBECTL[@]}" apply -f "${ROOT_DIR}/k8s/manifests"

for tls_consumer in fixture-service mysql-tls postgres-tls mongo-tls redis-tls kafka-tls sqs-tls node-dependency-matrix; do
  "${KUBECTL[@]}" rollout restart "deployment/${tls_consumer}"
done

"${KUBECTL[@]}" rollout status deployment/mysql --timeout=180s
"${KUBECTL[@]}" rollout status deployment/postgres --timeout=180s
"${KUBECTL[@]}" rollout status deployment/mongo --timeout=180s
"${KUBECTL[@]}" rollout status deployment/redis --timeout=180s
"${KUBECTL[@]}" rollout status deployment/redpanda --timeout=180s
"${KUBECTL[@]}" rollout status deployment/localstack --timeout=180s
"${KUBECTL[@]}" rollout status deployment/fixture-service --timeout=180s
"${KUBECTL[@]}" rollout status deployment/mysql-tls --timeout=180s
"${KUBECTL[@]}" rollout status deployment/postgres-tls --timeout=180s
"${KUBECTL[@]}" rollout status deployment/mongo-tls --timeout=180s
"${KUBECTL[@]}" rollout status deployment/redis-tls --timeout=180s
"${KUBECTL[@]}" rollout status deployment/kafka-tls --timeout=180s
"${KUBECTL[@]}" rollout status deployment/sqs-tls --timeout=180s
"${KUBECTL[@]}" rollout status deployment/node-dependency-matrix --timeout=180s

"${KUBECTL[@]}" get pods,svc

if [[ -z "${KEPLOY_INGRESS_URL}" ]]; then
  if [[ -z "${KEPLOY_INGRESS_SCHEME}" ]]; then
    if [[ "${KEPLOY_INGRESS_HOST}" == "localhost" || "${KEPLOY_INGRESS_HOST}" == "127.0.0.1" ]]; then
      KEPLOY_INGRESS_SCHEME="http"
    else
      KEPLOY_INGRESS_SCHEME="https"
    fi
  fi

  KEPLOY_INGRESS_URL="${KEPLOY_INGRESS_SCHEME}://${KEPLOY_INGRESS_HOST}:${HOST_PROXY_PORT}"
fi

echo ""
echo "HTTP app: http://localhost:${HOST_APP_PORT}"
echo "gRPC app: localhost:${HOST_GRPC_PORT}"
echo "Keploy ingress URL: ${KEPLOY_INGRESS_URL}"
echo "Use that same ingress URL when you create the cluster in Keploy staging UI."

#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLUSTER_NAME="${KIND_CLUSTER_NAME:-keploy-timefreeze}"
IMAGE_NAME="${IMAGE_NAME:-node-docker-timefreeze:latest}"
KUBE_CONTEXT="kind-${CLUSTER_NAME}"

if ! kind get clusters | grep -qx "${CLUSTER_NAME}"; then
  kind create cluster --name "${CLUSTER_NAME}" --config "${ROOT_DIR}/k8s/kind-config.yaml"
fi

kubectl config use-context "${KUBE_CONTEXT}" >/dev/null
kubectl --context "${KUBE_CONTEXT}" wait --for=condition=Ready nodes --all --timeout=120s
kubectl --context "${KUBE_CONTEXT}" wait -n kube-system --for=condition=Ready pods --all --timeout=180s || true

docker build -t "${IMAGE_NAME}" "${ROOT_DIR}"
kind load docker-image "${IMAGE_NAME}" --name "${CLUSTER_NAME}"

kubectl --context "${KUBE_CONTEXT}" apply -f "${ROOT_DIR}/k8s/deployment.yaml"
kubectl --context "${KUBE_CONTEXT}" apply -f "${ROOT_DIR}/k8s/service.yaml"
kubectl --context "${KUBE_CONTEXT}" wait --for=condition=available --timeout=300s deployment/node-docker-timefreeze

echo
echo "Application is ready."
echo "App URL: http://localhost:30081"
echo "Namespace: default"
echo "Deployment: node-docker-timefreeze"

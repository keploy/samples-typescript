#!/bin/bash
set -euo pipefail

GRPC_TARGET="${GRPC_TARGET:-localhost:30090}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

show_recording_hint() {
  cat >&2 <<'EOF'
Hint: if this target is a Keploy-hosted recording pod in Kubernetes, send sample traffic through port-forward instead of the app NodePorts:
  kubectl -n default port-forward svc/node-dependency-matrix 8080:8080 9090:9090
  GRPC_TARGET=localhost:9090 bash scripts/send_grpc_traffic.sh
EOF
}

if ! output="$(
  GRPC_TARGET="${GRPC_TARGET}" ROOT_DIR="${ROOT_DIR}" node <<'NODE' 2>&1
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const rootDir = process.env.ROOT_DIR;
const target = process.env.GRPC_TARGET;
const protoPath = path.join(rootDir, 'proto', 'dependency_matrix.proto');
const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const proto = grpc.loadPackageDefinition(packageDefinition).dependencymatrix;
const client = new proto.DependencyMatrix(target, grpc.credentials.createInsecure());

client.Ping({ name: 'matrix' }, (pingErr, pingRes) => {
  if (pingErr) {
    console.error(pingErr);
    process.exit(1);
  }
  console.log(JSON.stringify(pingRes));
  client.RunDependencyScenario({ scenario: 'deps-http' }, (scenarioErr, scenarioRes) => {
    if (scenarioErr) {
      console.error(scenarioErr);
      process.exit(1);
    }
    console.log(JSON.stringify(scenarioRes));
    client.close();
  });
});
NODE
 )"; then
  printf '%s\n' "${output}" >&2
  if [[ "${output}" == *"ECONNREFUSED"* ]] && [[ "${GRPC_TARGET}" =~ localhost:(30090|31090)$ ]]; then
    show_recording_hint
  fi
  exit 1
fi

printf '%s\n' "${output}"

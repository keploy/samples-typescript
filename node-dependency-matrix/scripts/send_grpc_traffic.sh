#!/bin/bash
set -euo pipefail

GRPC_TARGET="${GRPC_TARGET:-localhost:30090}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

GRPC_TARGET="${GRPC_TARGET}" ROOT_DIR="${ROOT_DIR}" node <<'NODE'
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

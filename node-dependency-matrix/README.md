# Node Dependency Matrix

This sample is a TypeScript application built to validate Keploy cloud record/replay against a broad dependency matrix.

What it exposes:

- incoming HTTP
- incoming gRPC
- outgoing HTTPS
- outgoing HTTP/2
- outgoing gRPC
- outgoing MySQL
- outgoing Postgres
- outgoing Mongo
- outgoing Redis
- outgoing Kafka
- outgoing SQS-over-HTTPS
- outgoing generic TLS traffic
- a noisy endpoint
- an expected replay failure endpoint
- duplicate-friendly endpoints for static dedup verification

## Quick start

```bash
cd samples-typescript/node-dependency-matrix
npm install
npm run build
bash k8s/deploy-kind.sh
APP_URL=http://localhost:30081 bash scripts/record_traffic.sh
```

If the default host ports are already occupied, override them:

```bash
HOST_PROXY_PORT=31080 HOST_APP_PORT=31081 HOST_GRPC_PORT=31090 bash k8s/deploy-kind.sh
APP_URL=http://localhost:31081 bash scripts/record_traffic.sh
```

Optional incoming gRPC traffic:

```bash
GRPC_TARGET=localhost:30090 bash scripts/send_grpc_traffic.sh
```

## Docker Compose

For a non-Kubernetes local stack:

```bash
cd samples-typescript/node-dependency-matrix
npm install
bash scripts/compose_up.sh
APP_URL=http://localhost:38081 bash scripts/record_traffic.sh
GRPC_TARGET=localhost:39090 bash scripts/send_grpc_traffic.sh
```

To stop it:

```bash
bash scripts/compose_down.sh
```

If `38081` or `39090` are occupied:

```bash
APP_HTTP_PORT=48081 APP_GRPC_PORT=49090 bash scripts/compose_up.sh
APP_URL=http://localhost:48081 bash scripts/record_traffic.sh
GRPC_TARGET=localhost:49090 bash scripts/send_grpc_traffic.sh
```

## Keploy expectations

The machine-readable contract is:

```bash
fixtures/expected-values.json
```

Use it later in Playwright or manual verification for:

- testcase counts
- required and acceptable mock kinds
- scenario-to-mock-kind mapping
- the exact HTTP and gRPC traffic plans
- hosted UI + Helm expectations for Kind
- total mock count ranges
- dedup expectations
- expected replay pass/noisy/fail scenarios

## Kubernetes

The full Kind and hosted UI flow is in:

```bash
k8s/README.md
```

The detailed step-by-step staging runbook and troubleshooting guide is in:

```bash
k8s/STAGING_RUNBOOK.md
```

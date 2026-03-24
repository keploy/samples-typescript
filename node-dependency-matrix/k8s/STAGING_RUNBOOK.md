# Staging K8s Runbook

This is the end-to-end runbook for using `node-dependency-matrix` with:

- a local Kind cluster
- hosted Keploy staging UI
- `k8s-proxy`
- manual recording and replay validation

This document is based on the exact flow that was used to make the sample work on a Mac.

## Scope

This runbook covers:

- local tool setup
- sample deployment into Kind
- cluster registration in hosted staging UI
- `k8s-proxy` Helm install
- record-time traffic generation
- replay expectations
- troubleshooting for the real errors that came up while stabilizing the sample

## 1. Use the right branch

```bash
cd /Users/asish/coding/work/regression-test-kube-cloud-flow/samples-typescript
git fetch origin
git checkout codex/node-dependency-matrix
git pull
cd node-dependency-matrix
```

The branch that contains the working setup is:

- `codex/node-dependency-matrix`

## 2. Install and verify tools

You need:

- Docker Desktop
- `kubectl`
- `kind`
- Helm
- Node.js + npm

On this Mac, tool lookup was sometimes inconsistent between shells. If commands are missing, use:

```bash
export PATH=/opt/homebrew/bin:/usr/local/bin:/Applications/Docker.app/Contents/Resources/bin:$PATH
```

Verify:

```bash
docker --version
kubectl version --client
kind --version
helm version
node --version
npm --version
```

## 3. Deploy the sample into Kind

Default ports:

- proxy host port: `30080`
- app HTTP port: `30081`
- app gRPC port: `30090`

If those ports are free:

```bash
bash k8s/deploy-kind.sh
```

If they are not free, use custom host ports. This is what was used during the working validation:

```bash
HOST_PROXY_PORT=31080 HOST_APP_PORT=31081 HOST_GRPC_PORT=31090 bash k8s/deploy-kind.sh
```

What this does:

- creates the Kind cluster
- generates sample certs
- builds and loads the sample image
- deploys MySQL, Postgres, Mongo, Redis, Redpanda, LocalStack, TLS fixtures, and the app

## 4. Validate the sample before involving Keploy

For the custom-port setup:

```bash
curl http://localhost:31081/health
APP_URL=http://localhost:31081 bash scripts/record_traffic.sh
GRPC_TARGET=localhost:31090 bash scripts/send_grpc_traffic.sh
```

For default ports, replace `31081/31090` with `30081/30090`.

Expected behavior:

- `/health` returns JSON with `status: ok`
- `record_traffic.sh` runs all scenarios and exits `0`
- `send_grpc_traffic.sh` returns a `pong` response and a `deps-http` scenario result

## 5. Open hosted staging UI

Use the staging cluster UI:

- [https://app.staging.keploy.io/clusters](https://app.staging.keploy.io/clusters)

When you create the cluster entry, use:

- cluster name: `node-dependency-matrix`
- ingress URL: `http://localhost:31080` if you used custom host port `31080`
- ingress URL: `http://localhost:30080` if you used the default host port

Important:

- the browser-facing ingress URL must match the host port on your Mac
- the chart `service.nodePort` inside Kind still stays `30080`

## 6. Install `k8s-proxy`

Do not rely blindly on the UI-generated Helm command. Validate the effective values.

For staging, the chart must effectively use:

- `keploy.accessKey=<access key from staging UI>`
- `keploy.clusterName=node-dependency-matrix`
- `keploy.apiServerUrl=https://api.staging.keploy.io`
- `keploy.ingressUrl=http://localhost:31080` or `http://localhost:30080`
- `environment=staging`
- `service.type=NodePort`
- `service.nodePort=30080`
- `proxy.insecure.enabled=true`

Example for the custom host-port flow:

```bash
export PATH=/opt/homebrew/bin:/usr/local/bin:/Applications/Docker.app/Contents/Resources/bin:$PATH

helm upgrade --install k8s-proxy oci://docker.io/keploy/k8s-proxy-chart --version 3.3.8 \
  --namespace keploy \
  --create-namespace \
  --set keploy.accessKey="<ACCESS_KEY_FROM_STAGING_UI>" \
  --set keploy.clusterName="node-dependency-matrix" \
  --set keploy.apiServerUrl="https://api.staging.keploy.io" \
  --set keploy.ingressUrl="http://localhost:31080" \
  --set environment="staging" \
  --set service.type="NodePort" \
  --set service.nodePort="30080" \
  --set proxy.insecure.enabled="true"
```

Why this matters:

- the chart uses nested `keploy.*` values
- the top-level `apiServerUrl` value is not enough
- without `service.type=NodePort`, the browser cannot reach the cluster agent
- without `proxy.insecure.enabled=true`, localhost browser access becomes a TLS/cert problem

## 7. Verify `k8s-proxy`

```bash
export PATH=/opt/homebrew/bin:/usr/local/bin:/Applications/Docker.app/Contents/Resources/bin:$PATH

kubectl get pods -n keploy
kubectl get svc -n keploy
kubectl logs -n keploy -l app=k8s-proxy --tail=100 -f
```

Healthy signals:

- the pod is `Running`
- the cluster page in staging becomes `Active`
- logs include `Initial Login successful`
- logs point to `https://api.staging.keploy.io`
- the service exposes `8081:30080/TCP`

## 8. Start recording

In staging UI:

1. Open cluster `node-dependency-matrix`
2. Find deployment `default / node-dependency-matrix`
3. Click `Record`
4. Keep the normal defaults in the recording dialog
5. Start recording

While recording starts:

```bash
export PATH=/opt/homebrew/bin:/usr/local/bin:/Applications/Docker.app/Contents/Resources/bin:$PATH
kubectl get pods -n default -w
```

Expected behavior:

- the app deployment restarts
- the new app pod becomes `2/2 Running`

That `2/2` is the app container plus the Keploy sidecar.

## 9. Send record-time traffic

For the working custom-port flow:

```bash
cd /Users/asish/coding/work/regression-test-kube-cloud-flow/samples-typescript/node-dependency-matrix
APP_URL=http://localhost:31081 bash scripts/record_traffic.sh
GRPC_TARGET=localhost:31090 bash scripts/send_grpc_traffic.sh
```

What this hits:

- `/deps/http`
- `/deps/http2`
- `/deps/grpc`
- `/deps/mysql`
- `/deps/postgres`
- `/deps/mongo`
- `/deps/redis`
- `/deps/kafka`
- `/deps/sqs`
- `/deps/generic`
- GET and POST dedup endpoints
- async background-sync start and wait endpoints
- noisy endpoint
- expected replay-failure endpoint
- incoming gRPC endpoints

The seed script now prints each scenario name before it runs, so failures are obvious.

## 10. Stop recording and inspect the run

In the UI:

1. Stop recording
2. Open the captured recordings
3. Compare what you see with:
   - [expected-values.json](/Users/asish/coding/work/regression-test-kube-cloud-flow/samples-typescript/node-dependency-matrix/fixtures/expected-values.json)

What to verify:

- 23 HTTP testcases and 2 incoming gRPC testcases were captured
- mock kinds are present for supported outgoing dependencies
- dedup captured repeated GET and POST requests
- the async workflow completed and captured its background HTTP, Redis, and SQS calls
- the noisy endpoint is recorded
- the time-window endpoint is recorded

## 11. Trigger replay

From the UI, start replay for the recorded run.

Expected replay contract is already encoded in:

- [expected-values.json](/Users/asish/coding/work/regression-test-kube-cloud-flow/samples-typescript/node-dependency-matrix/fixtures/expected-values.json)

In broad terms:

- core dependency flows should pass
- async catalog sync should pass
- `noise/runtime` should be noisy
- `expected-fail/time-window` is an intentional replay-failure case

## 12. How to refresh the app after code changes

If you change the sample and want that new code in the live Kind cluster:

```bash
cd /Users/asish/coding/work/regression-test-kube-cloud-flow/samples-typescript/node-dependency-matrix
npm run build
docker build --pull=false -t node-dependency-matrix:latest .
kind load docker-image node-dependency-matrix:latest --name node-dependency-matrix
kubectl rollout restart deployment/node-dependency-matrix -n default
kubectl rollout status deployment/node-dependency-matrix -n default --timeout=240s
```

Wait until the new pod is back at `2/2` before sending more traffic during an active recording window.

## 13. Troubleshooting

### Error: `Login failed, retrying... status code 401`

Symptoms:

- proxy logs show `https://api.keploy.io/cluster/login`
- repeated `401`
- cluster never becomes active

Cause:

- prod/staging mismatch, or
- wrong access key, or
- wrong chart values path

Fix:

1. Make sure you are using staging UI if you want staging.
2. Use nested `keploy.*` values in Helm, not only top-level values.
3. Set:
   - `keploy.apiServerUrl=https://api.staging.keploy.io`
   - `environment=staging`
4. Create a fresh cluster in staging UI if the access key may be stale.

### Error: cluster page shows active heartbeat but agent is not reachable

Symptoms:

- cluster page is active
- deployment list is broken or agent connection fails

Cause:

- wrong ingress URL or wrong host port

Fix:

1. Check what host port your Kind cluster actually mapped.
2. If you used `HOST_PROXY_PORT=31080`, the hosted UI cluster entry and Helm `keploy.ingressUrl` must both use `http://localhost:31080`.
3. Keep `service.nodePort=30080` inside the chart.

### Error: browser cannot connect to `https://localhost:30080`

Cause:

- the secure listener needs browser trust

Fix:

- Prefer `proxy.insecure.enabled=true` with `http://localhost:<host-port>` for local Mac + hosted UI.

That is the setup used here.

### Error: pod never becomes `2/2` after record starts

Symptoms:

- recording starts in UI
- app pod restarts or hangs incorrectly
- sidecar is not present

Fix:

```bash
kubectl get pods -n default
kubectl describe pod <pod-name> -n default
kubectl logs -n keploy -l app=k8s-proxy --tail=200
```

You want to confirm the webhook and restart flow succeeded.

### Error: MySQL request returns `500` during recording

Symptoms:

- `/deps/mysql` fails during recording
- Keploy logs mention `caching_sha2_password`

Cause:

- Keploy’s MySQL recorder does not reliably handle the default MySQL 8 `caching_sha2_password` handshake

Fix already applied in this sample:

- MySQL is started with `mysql_native_password`

Files:

- [01-mysql.yaml](/Users/asish/coding/work/regression-test-kube-cloud-flow/samples-typescript/node-dependency-matrix/k8s/manifests/01-mysql.yaml)
- [compose.yaml](/Users/asish/coding/work/regression-test-kube-cloud-flow/samples-typescript/node-dependency-matrix/compose.yaml)

### Error: Redis request fails with `ERR_TLS_CERT_ALTNAME_INVALID`

Symptoms:

- `/deps/redis` fails
- app logs mention hostname mismatch for `redis-tls`

Cause:

- current Keploy TLS MITM path for Redis does not preserve SANs in a way that satisfies strict hostname verification

Fix already applied in this sample:

- keep TLS
- skip hostname verification for that Redis client

File:

- [dependencies.ts](/Users/asish/coding/work/regression-test-kube-cloud-flow/samples-typescript/node-dependency-matrix/src/lib/dependencies.ts)

### Error: generic TLS request fails with hostname mismatch

Symptoms:

- `/deps/generic` returns `500`
- app logs mention `fixture-service` alt-name mismatch

Cause:

- same class of TLS MITM SAN mismatch as Redis

Fix already applied in this sample:

- keep TLS
- skip hostname verification for the generic TLS socket

File:

- [dependencies.ts](/Users/asish/coding/work/regression-test-kube-cloud-flow/samples-typescript/node-dependency-matrix/src/lib/dependencies.ts)

### Error: Docker build hangs on `load metadata for docker.io/library/node:20-bookworm-slim`

Symptoms:

- Docker stalls on the base image metadata step
- BuildKit hangs before the real build starts

Fix:

1. The Dockerfile is pinned to the exact digest that was already working locally.
2. Build with:

```bash
docker build --pull=false -t node-dependency-matrix:latest .
```

File:

- [Dockerfile](/Users/asish/coding/work/regression-test-kube-cloud-flow/samples-typescript/node-dependency-matrix/Dockerfile)

### Error: `kubectl`, `helm`, `docker`, `npm`, or `node` are not found

Cause:

- shell PATH does not include Homebrew or Docker Desktop CLI locations

Fix:

```bash
export PATH=/opt/homebrew/bin:/usr/local/bin:/Applications/Docker.app/Contents/Resources/bin:$PATH
```

## 14. Commands that were used successfully in the working setup

Deploy:

```bash
HOST_PROXY_PORT=31080 HOST_APP_PORT=31081 HOST_GRPC_PORT=31090 bash k8s/deploy-kind.sh
```

Validate sample:

```bash
curl http://localhost:31081/health
APP_URL=http://localhost:31081 bash scripts/record_traffic.sh
GRPC_TARGET=localhost:31090 bash scripts/send_grpc_traffic.sh
```

Install `k8s-proxy` for staging:

```bash
helm upgrade --install k8s-proxy oci://docker.io/keploy/k8s-proxy-chart --version 3.3.8 \
  --namespace keploy \
  --create-namespace \
  --set keploy.accessKey="<ACCESS_KEY_FROM_STAGING_UI>" \
  --set keploy.clusterName="node-dependency-matrix" \
  --set keploy.apiServerUrl="https://api.staging.keploy.io" \
  --set keploy.ingressUrl="http://localhost:31080" \
  --set environment="staging" \
  --set service.type="NodePort" \
  --set service.nodePort="30080" \
  --set proxy.insecure.enabled="true"
```

Verify proxy:

```bash
kubectl get pods -n keploy
kubectl get svc -n keploy
kubectl logs -n keploy -l app=k8s-proxy --tail=100
```

## 15. Cleanup

```bash
helm uninstall -n keploy k8s-proxy
kind delete cluster --name node-dependency-matrix
```

# Kubernetes Setup

This sample is designed for Keploy cloud record/replay validation in Kind.

What it covers:

- incoming HTTP
- incoming gRPC
- outgoing HTTPS
- outgoing HTTP/2
- outgoing gRPC
- outgoing MySQL
- outgoing Postgres
- outgoing Mongo over TLS
- outgoing Redis over TLS
- outgoing Kafka
- outgoing SQS-over-HTTPS
- generic TLS traffic
- noisy replay cases
- expected replay failures
- static dedup-friendly duplicate requests

Protocol note:

- HTTPS, HTTP/2, gRPC, Mongo, Redis, SQS, and the generic socket flow use TLS in this sample
- MySQL, Postgres, and Kafka use direct protocol connections because a generic TLS terminator in front of those protocols is not deterministic enough for this Kind-based regression sample

## 1. Create the cluster and deploy the sample

From `samples-typescript/node-dependency-matrix/`:

```bash
bash k8s/deploy-kind.sh
```

On the first run this pre-pulls the heavier dependency images directly inside the Kind node before applying the manifests. That is intentional. It avoids slow pod-level image pulls that can make the Kind control plane flaky on Macs.

If `30080`, `30081`, or `30090` are already taken on your machine, override them:

```bash
HOST_PROXY_PORT=31080 HOST_APP_PORT=31081 HOST_GRPC_PORT=31090 bash k8s/deploy-kind.sh
```

If you already created a broken or half-ready cluster, delete it first and re-run:

```bash
kind delete cluster --name node-dependency-matrix
HOST_PROXY_PORT=31080 HOST_APP_PORT=31081 HOST_GRPC_PORT=31090 bash k8s/deploy-kind.sh
```

## 2. Validate the app before Keploy

```bash
curl http://localhost:30081/health
bash scripts/record_traffic.sh
```

Optional incoming gRPC validation:

```bash
bash scripts/send_grpc_traffic.sh
```

## 3. Connect the cluster in Keploy UI

Use:

- cluster name: `node-dependency-matrix`
- ingress URL: `http://localhost:30080`

If you used custom host ports, use that custom proxy host port instead.

Install `k8s-proxy` as a NodePort on `30080` or your custom proxy host port.

Hosted staging UI note:

- if your sample app is on custom host ports, only the proxy ingress URL needs to change in the Keploy cluster registration flow
- the app traffic scripts should use the custom app/grpc host ports you selected locally
- do not run local `enterprise-ui` or local `api-server` for this flow; use the hosted staging UI and the Helm command it generates
- after the proxy install, verify the cluster status turns `Active` before you try to record

## 3A. What the Helm install must do

When you create the cluster in staging UI and copy the Helm command, the effective values must point to staging, not production:

- `keploy.clusterName=node-dependency-matrix`
- `keploy.apiServerUrl=https://api.staging.keploy.io`
- `environment=staging`
- `keploy.ingressUrl=http://localhost:30080`
- `service.type=NodePort`
- `service.nodePort=30080`

If you used a custom proxy host port, replace `30080` with that custom port in the cluster ingress URL and in the Helm values.

After the Helm install, verify:

```bash
kubectl get pods -n keploy
kubectl logs -n keploy -l app=k8s-proxy --tail=50 -f
```

What you want to see:

- the `k8s-proxy` pod is `Running`
- no repeated `401` login failures
- the cluster page in staging UI shows `Active`

## 4. Start recording

Record:

- namespace: `default`
- deployment: `node-dependency-matrix`

When recording starts, the app pod should roll and become `2/2`.

```bash
kubectl get pods -w
```

## 5. Generate traffic while recording

```bash
APP_URL=http://localhost:30081 bash scripts/record_traffic.sh
GRPC_TARGET=localhost:30090 bash scripts/send_grpc_traffic.sh
```

If you used custom host ports:

```bash
APP_URL=http://localhost:31081 bash scripts/record_traffic.sh
GRPC_TARGET=localhost:31090 bash scripts/send_grpc_traffic.sh
```

Expected record-time behavior:

- the deployment should restart when recording starts
- the restarted pod should become `2/2`
- the HTTP script should create 17 HTTP testcases
- the gRPC script should add 2 more incoming testcases
- the noisy endpoint should appear in replay as noisy
- the time-window endpoint should be an expected replay failure

## 6. Expectations

The machine-readable contract is in:

```bash
fixtures/expected-values.json
```

Use it for:

- expected pod count
- testcase count from the seed scripts
- required/preferred mock kinds
- acceptable fallback mock kinds where runtime support depends on enterprise parser wiring
- dedup expectations
- expected pass/noisy/fail replay outcomes

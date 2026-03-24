# Kubernetes Setup

This sample is the Kind-based regression target for Keploy Enterprise + `k8s-proxy` recording in Kubernetes.

What it covers:

- incoming HTTP testcases
- incoming gRPC testcases
- outgoing HTTPS
- outgoing HTTP/2
- outgoing gRPC
- outgoing MySQL
- outgoing Postgres
- outgoing Mongo over TLS
- outgoing Redis over TLS
- outgoing Kafka
- outgoing SQS over HTTPS
- outgoing generic TLS traffic
- noisy replay cases
- expected replay failures
- static dedup-friendly duplicate requests

Transport notes:

- incoming HTTP is plaintext on the sample service
- incoming gRPC is plaintext on the sample service
- outgoing HTTPS, HTTP/2, gRPC, Mongo, Redis, SQS, and the generic socket flow use TLS in the default path
- outgoing MySQL, Postgres, and Kafka use direct protocol connections in the default path
- MySQL is started with `mysql_native_password` because the current Keploy MySQL recorder does not handle the default MySQL 8 `caching_sha2_password` handshake reliably during recording
- Redis and the generic TLS socket keep TLS but skip hostname verification because the current Keploy TLS MITM path for those flows does not preserve SANs reliably during recording
- `mysql-tls`, `postgres-tls`, and `kafka-tls` are deployed for experimentation, but they are not exercised by the default app config today

The official Keploy Kind flow is documented at [Kubernetes Local Setup (Kind)](https://keploy.io/docs/keploy-cloud/kubernetes-local-setup/). The VM-specific hosted UI flow in `Run k8s-proxy ( with our ui ) with the kind in our vm’s.pdf` adds the hostname/TLS details you need when the cluster is running on a VM and the browser is on your laptop.

## 1. Prerequisites

Install and verify:

- Docker
- `kind`
- `kubectl`
- Helm
- access to a hosted Keploy UI environment

You do not need a local `enterprise-ui` or `api-server` for this flow. Use whichever hosted environment you want and keep the UI domain, `apiServerUrl`, and Helm `environment` value consistent.

## 2. Choose the ingress mode before you deploy

You need one ingress URL for `k8s-proxy`, and the exact same URL must be used in:

- the hosted UI cluster entry
- the Helm value `keploy.ingressUrl`
- your browser trust flow

### Option A: same machine as the browser

If the browser and the Kind cluster are on the same machine, use:

```text
http://localhost:30080
```

This matches the official doc and requires `proxy.insecure.enabled=true`.

### Option B: Kind is running inside a VM

If the cluster is on a VM and you are opening the hosted UI from your laptop, use a hostname that resolves to the VM IP and open the proxy over HTTPS:

```text
https://<your-domain>:30080
```

Do this first on the laptop:

1. Add an `/etc/hosts` entry that maps the VM IP to the hostname you will use.
2. Open `https://<your-domain>:30080` once after `k8s-proxy` is installed and accept the self-signed certificate warning.
3. If Chrome ignores your hosts entry because of secure DNS, disable secure DNS or use a browser that honors the local hosts mapping.

The PDF examples use hostnames like `https://ayush.sharma.io:30080` and `https://yogesh.keploy.io:30080`.

## 3. Create the Kind cluster and deploy the sample

From `samples-typescript/node-dependency-matrix/`:

```bash
bash k8s/deploy-kind.sh
```

If `30080`, `30081`, or `30090` are already taken:

```bash
HOST_PROXY_PORT=31080 HOST_APP_PORT=31081 HOST_GRPC_PORT=31090 bash k8s/deploy-kind.sh
```

If you want the deploy script to print the VM/domain ingress URL instead of `localhost`, set it before running:

```bash
KEPLOY_INGRESS_URL=https://matrix.keploy.vm:30080 bash k8s/deploy-kind.sh
```

Or let the script build it for you:

```bash
KEPLOY_INGRESS_HOST=matrix.keploy.vm bash k8s/deploy-kind.sh
```

If you need to recreate the cluster:

```bash
kind delete cluster --name node-dependency-matrix
bash k8s/deploy-kind.sh
```

What `k8s/deploy-kind.sh` already does:

- creates the Kind cluster with NodePort mappings for `30080`, `30081`, and `30090`
- generates the sample CA and leaf certs
- builds and loads the `node-dependency-matrix` image into Kind
- deploys MySQL, Postgres, Mongo, Redis, Redpanda, LocalStack, the TLS fixtures, and the app

## 4. Validate the sample before involving Keploy

Run these on the machine where Kind is running:

```bash
curl http://localhost:30081/health
APP_URL=http://localhost:30081 bash scripts/record_traffic.sh
GRPC_TARGET=localhost:30090 bash scripts/send_grpc_traffic.sh
```

If you changed the host ports, keep using the overridden app/gRPC ports in the traffic scripts.

## 5. Choose the hosted Keploy environment

Supported examples:

- production UI: `https://app.keploy.io/clusters`
- staging UI: `https://app.staging.keploy.io/clusters`

Use the matching API server and Helm `environment` value:

- production: `keploy.apiServerUrl=https://api.keploy.io`, `environment=prod`
- staging: `keploy.apiServerUrl=https://api.staging.keploy.io`, `environment=staging`

The sample is environment-agnostic. Pick one environment and keep it consistent end to end.

## 6. Create the cluster in the hosted UI

Open your chosen hosted clusters page and create a new cluster with:

- cluster name: `node-dependency-matrix`
- ingress URL:
  - `http://localhost:30080` for localhost mode
  - `https://<your-domain>:30080` for VM/domain mode

If you changed the proxy host port, replace `30080` with that port everywhere.

## 7. Install `k8s-proxy` from the UI-generated Helm command

Copy the Helm command generated by the hosted UI you chose, then verify that the effective values are:

- `keploy.clusterName=node-dependency-matrix`
- `keploy.apiServerUrl=<the API server for the environment you chose>`
- `environment=<prod or staging, matching the chosen environment>`
- `keploy.ingressUrl=<the exact URL you entered in the hosted UI>`
- `service.type=NodePort`
- `service.nodePort=30080`
- `proxy.insecure.enabled=true`

Notes:

- `proxy.insecure.enabled=true` is required for the `http://localhost:30080` NodePort flow from the official doc.
- For the VM/domain flow, keep the hostname exactly consistent between the hosted UI entry, the Helm value, and your `/etc/hosts` entry.
- Do not mix environments. For example, do not use `app.staging.keploy.io` with `https://api.keploy.io`, and do not use `environment=prod` with staging URLs.

After Helm install:

```bash
kubectl get pods -n keploy
kubectl logs -n keploy -l app=k8s-proxy --tail=100 -f
```

Healthy signals:

- the `k8s-proxy` pod reaches `Running`
- no repeated `401` login failures
- the hosted UI cluster page turns `Active`
- the `default` namespace and `node-dependency-matrix` deployment are visible in the UI

## 8. Start recording in the hosted UI

Record this deployment:

- namespace: `default`
- deployment: `node-dependency-matrix`

When recording starts, the app pod should roll and become `2/2` because the Keploy sidecar gets injected.

Watch it:

```bash
kubectl get pods -w
```

## 9. Generate record-time traffic

Run these on the machine where the Kind cluster is running:

```bash
APP_URL=http://localhost:30081 bash scripts/record_traffic.sh
GRPC_TARGET=localhost:30090 bash scripts/send_grpc_traffic.sh
```

If you changed host ports:

```bash
APP_URL=http://localhost:31081 bash scripts/record_traffic.sh
GRPC_TARGET=localhost:31090 bash scripts/send_grpc_traffic.sh
```

Expected record-time behavior:

- the deployment restarts when recording begins
- the restarted pod becomes `2/2`
- the HTTP script creates exactly 17 HTTP testcases
- the gRPC script adds 2 incoming gRPC testcases
- the mock inventory includes the supported outgoing kinds, with acceptable fallbacks captured in the expectations file
- the noisy endpoint is reported as noisy during replay
- the time-window endpoint is an intentional replay failure

## 10. Use the machine-readable contract for replay and Playwright

The contract is in:

```bash
fixtures/expected-values.json
```

It now includes:

- the supported incoming and outgoing coverage matrix
- the hosted UI and Helm expectations
- the exact HTTP and gRPC traffic plans
- preferred and acceptable mock kinds per scenario
- dedup expectations
- expected pass/noisy/fail replay outcomes

The sample also exposes the same contract over HTTP:

```bash
curl http://localhost:30081/expectations
```

That endpoint is the easiest source for future Playwright wiring because it keeps the traffic plan and verification contract next to the sample itself.

## 11. Playwright-friendly traffic path

The existing cluster Playwright flow in `enterprise-ui` uses two separate network paths:

- the browser talks to `k8s-proxy` through the cluster ingress URL
- the sample traffic itself is sent through `kubectl port-forward` to the app service

This sample now documents that explicitly. For later Playwright work, port-forward the app service instead of sending sample traffic to the proxy ingress:

```bash
bash k8s/port-forward.sh
```

Then use:

```bash
curl http://localhost:8080/health
APP_URL=http://localhost:8080 bash scripts/record_traffic.sh
GRPC_TARGET=localhost:9090 bash scripts/send_grpc_traffic.sh
```

The same ports and service name are also captured in `fixtures/expected-values.json`.

## 12. Troubleshooting

If the cluster never becomes `Active`:

- verify the ingress URL in the hosted UI exactly matches the Helm value
- check `kubectl logs -n keploy -l app=k8s-proxy`
- confirm the access key in the Helm command is valid for the environment you chose
- confirm the UI domain, `apiServerUrl`, and Helm `environment` all point to the same environment

If the laptop browser cannot reach the VM-hosted proxy:

- verify the VM IP to hostname mapping in `/etc/hosts`
- make sure the Kind control-plane NodePort is mapped to `30080`
- confirm the service exists with `kubectl -n keploy get svc`
- visit the HTTPS ingress URL once and accept the certificate warning

If recording starts but the app pod never reaches `2/2`:

- check `kubectl describe pod <pod-name>`
- check `kubectl logs deployment/node-dependency-matrix`
- verify the Keploy webhook and sidecar injection are healthy in the `k8s-proxy` logs

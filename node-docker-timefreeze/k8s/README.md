# Kubernetes Setup

This directory contains the local Kind setup for `node-docker-timefreeze`.

The layout is meant for Keploy record/replay in Kubernetes:

- app service on `http://localhost:30081`
- `k8s-proxy` on `http://localhost:30080`

This sample is good for:

- time-freeze validation
- record/replay validation
- sidecar injection validation

It is not a good mock-generation sample yet because it does not make outbound dependency calls.

## 1. Create the Kind cluster

Run from `node-docker-timefreeze/`:

```bash
kind create cluster --name keploy-timefreeze --config k8s/kind-config.yaml
```

Or use the helper:

```bash
bash k8s/deploy-kind.sh
```

If Docker Hub metadata fetches are flaky on your machine, the helper already builds with
`--pull=false` and can reuse an existing local image. If you have already built
`node-docker-timefreeze:latest` once, you can skip rebuilding entirely:

```bash
SKIP_BUILD=1 bash k8s/deploy-kind.sh
```

## 2. Manual deploy flow

```bash
docker build --pull=false -t node-docker-timefreeze:latest .
kind load docker-image node-docker-timefreeze:latest --name keploy-timefreeze
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl wait --for=condition=available --timeout=180s deployment/node-docker-timefreeze
kubectl get pods,svc
```

## 3. Validate the app from your machine

```bash
curl http://localhost:30081/health
curl -X POST http://localhost:30081/login
APP_URL=http://localhost:30081 ./test_time_endpoint.sh
APP_URL=http://localhost:30081 ./test_record_replay_flow.sh
```

## 4. Keploy record/replay flow

Create the cluster in Keploy UI with:

- cluster name: `keploy-timefreeze`
- ingress URL: `http://localhost:30080`

Install `k8s-proxy` as a NodePort on `30080`.

If you run the local Keploy `api-server`, use your machine IP for `apiServerUrl`, not `localhost`.

Example:

```bash
helm upgrade --install k8s-proxy /Users/asish/coding/work/regression-test-kube-cloud-flow/k8s-proxy/charts/k8s-proxy \
  --create-namespace --namespace keploy \
  --set accessKey="<YOUR_ACCESS_KEY>" \
  --set apiServerUrl="http://<YOUR_MACHINE_IP>:8083" \
  --set clusterName="keploy-timefreeze" \
  --set environment="staging" \
  --set ingressUrl="http://localhost:30080" \
  --set service.type=NodePort \
  --set service.nodePort=30080
```

Verify:

```bash
kubectl get pods -n keploy
kubectl get svc -n keploy
```

Then record this deployment in the UI:

- namespace: `default`
- deployment: `node-docker-timefreeze`

When recording starts, the app pod should briefly roll and come back as `2/2`.

Check with:

```bash
kubectl get pods -w
```

Generate traffic while recording:

```bash
APP_URL=http://localhost:30081 ./test_record_replay_flow.sh
```

Then stop recording and replay from the UI.

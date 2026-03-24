# Node Docker Timefreeze

This sample is a small Express application for Keploy time-freeze validation.

Endpoints:

- `POST /login`
- `GET /protected`
- `GET /check-time?ts=<unix-seconds>`
- `GET /health`

## Docker

Build and run:

```bash
docker build -t node-docker-timefreeze:latest .
docker run --rm -p 8080:8080 --name node-docker-timefreeze node-docker-timefreeze:latest
```

Generate traffic:

```bash
curl -X POST http://localhost:8080/login
./test_time_endpoint.sh
APP_URL=http://localhost:8080 ./test_record_replay_flow.sh
```

## Kubernetes

The local Kind setup for Keploy K8s record/replay is documented in [k8s/README.md](./k8s/README.md).

Quick path:

```bash
bash k8s/deploy-kind.sh
APP_URL=http://localhost:30081 ./test_record_replay_flow.sh
```

If Docker Hub is timing out while resolving the base image, first try:

```bash
docker build --pull=false -t node-docker-timefreeze:latest .
```

If the image already exists locally, you can skip rebuilding during Kind deployment:

```bash
SKIP_BUILD=1 bash k8s/deploy-kind.sh
```

The deployment to record in Keploy is:

- namespace: `default`
- deployment: `node-docker-timefreeze`

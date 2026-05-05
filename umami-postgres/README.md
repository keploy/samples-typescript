# umami-postgres — keploy compat lane sample

Reproducer for the umami / postgres-v3 compat lane. Mirrors the architectural pattern of the [doccano-django sample in `samples-python`](https://github.com/keploy/samples-python/tree/main/doccano-django): the sample owns orchestration (compose + bootstrap + traffic), the keploy CI lanes consume it as a thin wrapper.

The sample drives the full umami v2 API surface keploy needs to gate on a record/replay round-trip — auth + me + admin lists, users CRUD, websites CRUD, all eight report types, share tokens + public share access, batch + identify event ingest, sessions deep-dive, replays, boards lifecycle, pixel tracker, metric/pageview parser-branch variants, and logout.

## Layout

```
umami-postgres/
├── Dockerfile             # FROM ghcr.io/umami-software/umami:postgresql-v2.18.1
├── docker-compose.yml     # postgres-15 + umami v2 on a fixed subnet, env-driven
├── flow.sh                # bootstrap | record-traffic | coverage
├── keploy.yml.template    # globalNoise for createdAt/updatedAt/Date/uuid id fields
└── README.md              # this file
```

## Contract

The sample is keploy-independent: `docker compose up && bash flow.sh bootstrap && bash flow.sh record-traffic` runs end-to-end against bare umami. Lane scripts wrap that exact same path inside `keploy record` / `keploy test`.

* `bootstrap` — log in as admin via `/api/auth/login`, capture the JWT-style auth token, persist it to `/tmp/umami-token-${UMAMI_PHASE}` so subsequent calls share a deterministic Authorization header.
* `record-traffic` — drive the umami v2 API. Calls are fire-and-forget (`|| true` semantics) so a single endpoint regression in umami itself does not abort the run — keploy is the assertion layer at replay.
* `coverage` — no-op stub. The upstream umami image ships compiled+minified Next.js without sourcemaps, so source-line coverage is not meaningful without rebuilding from source. Returns 0 cleanly so `flow.sh coverage || true` informational hooks keep working.

## Local run

### Without keploy — smoke check

```sh
docker compose up -d
bash flow.sh bootstrap 240
bash flow.sh record-traffic
docker compose down -v
```

This is what the keploy/enterprise compat lane wraps in `keploy record` / `keploy test` — the base compose runs unchanged inside that lane.

### With keploy — record + replay

```sh
docker compose up -d
bash flow.sh bootstrap 240

# In one shell:
keploy record -c "docker compose up" --container-name umami_app \
  --proxy-port 13081 --dns-port 13082

# In another shell:
bash flow.sh record-traffic
# SIGINT keploy when traffic returns

keploy test -c "docker compose up" --containerName umami_app \
  --apiTimeout 60 --delay 30 --proxy-port 13081 --dns-port 13082
```

### Coverage

This sample does not emit a coverage metric. The upstream `ghcr.io/umami-software/umami:postgresql-v2.18.1` image ships a compiled + minified Next.js standalone build with no source tree or sourcemaps; V8 line coverage on minified output doesn't map back to anything a reviewer can act on, so a coverage gate would be misleading. The keploy/enterprise compat lane uses the record/replay assertions as its correctness gate, which is the meaningful test here.

If real source-line coverage becomes a hard requirement, the path is to rebuild umami from its own source (npm install + `next build` without minification) inside a `Dockerfile.coverage` overlay — a separate, larger change.

## Consumers

* `keploy/enterprise` `.woodpecker/umami-linux.yml` — record/replay matrix delegates compose + bootstrap + traffic to this sample.
* `keploy/integrations` may add a `.woodpecker/umami-postgres.yml` falsifying lane in a future PR.

# umami-postgres — keploy compat lane sample

Reproducer for the umami / postgres-v3 compat lane. Mirrors the architectural pattern of the [doccano-django sample in `samples-python`](https://github.com/keploy/samples-python/tree/main/doccano-django): the sample owns orchestration (compose / bootstrap / traffic / noise filter / coverage), the keploy CI lanes consume it as a thin wrapper.

The sample drives the full umami v2 API surface keploy needs to gate on a record/replay round-trip — auth + me + admin lists, users CRUD, websites CRUD, all eight report types, share tokens + public share access, batch + identify event ingest, sessions deep-dive, replays, boards lifecycle, pixel tracker, metric/pageview parser-branch variants, and logout.

## Layout

```
umami-postgres/
├── Dockerfile             # FROM ghcr.io/umami-software/umami:postgresql-v2.18.1
├── docker-compose.yml     # postgres-15 + umami v2 on a fixed subnet, env-driven
├── flow.sh                # bootstrap | record-traffic | coverage | list-routes
├── keploy.yml.template    # globalNoise for createdAt/updatedAt/Date/uuid id fields
└── README.md              # this file
```

## Contract

The sample is keploy-independent: `docker compose up && bash flow.sh bootstrap && bash flow.sh record-traffic` runs end-to-end against bare umami. Lane scripts wrap that exact same path inside `keploy record` / `keploy test`.

* `bootstrap` — log in as admin via `/api/auth/login`, capture the JWT-style auth token, persist it to `/tmp/umami-token-${UMAMI_PHASE}` so subsequent calls share a deterministic Authorization header.
* `record-traffic` — drive the umami v2 API. Every call is logged to `${UMAMI_FIRED_ROUTES_FILE}` (when set) so the `coverage` subcommand has a numerator without needing a keploy recording. Calls are fire-and-forget (`|| true` semantics) so a single endpoint regression in umami itself does not abort the run — keploy is the assertion layer at replay.
* `coverage` — walks the running container's `src/app/api/**/route.ts` tree as the denominator (the umami router is file-system based), compares against fired/recorded routes, emits a `(method, path)` percentage.
* `list-routes` — diagnostic; prints the route table.

## Local run

```sh
docker compose up -d
bash flow.sh bootstrap 240
UMAMI_FIRED_ROUTES_FILE=/tmp/fired.log bash flow.sh record-traffic
UMAMI_FIRED_ROUTES_FILE=/tmp/fired.log bash flow.sh coverage
docker compose down -v
```

## Consumers

Lanes pinned to this sample:

* `keploy/enterprise` `.woodpecker/umami-linux.yml` — record/replay matrix delegates compose + bootstrap + traffic to this sample.
* `keploy/integrations` may add a `.woodpecker/umami-postgres.yml` falsifying lane in a future PR.

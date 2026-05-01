# umami-postgres — keploy compat lane sample (work in progress)

Minimum reproducer scaffold for the umami / postgres-v3 compat lane. Mirrors the architectural pattern of the [doccano-django sample in `samples-python`](https://github.com/keploy/samples-python/tree/main/doccano-django): the sample owns orchestration (compose / bootstrap / traffic / noise filter / coverage), the keploy CI lanes consume it as a thin wrapper.

## Status

**This is a SCAFFOLD.** The compose, bootstrap, and a minimal record-traffic loop work end-to-end against bare umami without keploy in the picture. The full traffic loop the existing keploy/enterprise lane drives (`run_api_flow` in `enterprise/.ci/scripts/umami-linux.sh`, ~250 lines covering websites / events / sessions / reports / share-tokens / shareability) has **not been ported** into `flow.sh::umami_record_traffic` yet. Lanes consuming this sample today should either:

1. Port the missing curls into `flow.sh::umami_record_traffic` (preferred — that's the migration this scaffold is designed around).
2. Or call into `enterprise/.ci/scripts/umami-linux.sh::run_api_flow` directly between `flow.sh bootstrap` and `flow.sh coverage` until the migration completes.

See the migration plan in this PR's description / linked issue for the full porting checklist.

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

* `bootstrap` — login as admin via `/api/auth/login`, capture the JWT-style auth token, persist it to `/tmp/umami-token-${UMAMI_PHASE}` so subsequent calls share a deterministic Authorization header.
* `record-traffic` — drive the umami v1 API. Every call is logged to `${UMAMI_FIRED_ROUTES_FILE}` (when set) so the `coverage` subcommand has a numerator without needing a keploy recording.
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

Lanes pinning to this sample (pinned via `--branch feat/keploy-compat-lanes-rollout` until merge):

* `keploy/enterprise` `.woodpecker/umami-linux.yml` — being slimmed in a follow-up PR.
* `keploy/integrations` may add a `.woodpecker/umami-postgres.yml` falsifying lane in a future PR (currently no integrations-side coverage of this app).

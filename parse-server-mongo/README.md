# parse-server-mongo

Parse Server (`parseplatform/parse-server` 9.x via `parse-server` npm 8.2.x) backed by MongoDB 7. Packaged as a complete keploy compat-lane sample: subcommand-driven traffic, env-driven docker-compose so concurrent matrix cells share a daemon, a noise-filter template that masks the parse-server identifiers that change every run, and a curated route list for coverage reporting.

The lane consumer is **keploy/enterprise** — its `.ci/scripts/parse-server-linux.sh` clones this repo and orchestrates record / replay against `flow.sh`.

## Layout

| File | Role |
|---|---|
| `index.js` | 25-line Parse Server bootstrap; reads config from env |
| `package.json` | Pins `parse-server@8.2.3` and `express@4.21.2` |
| `Dockerfile` | `node:20-bookworm-slim` + `npm install --omit=dev` (base; uninstrumented) |
| `Dockerfile.coverage` | extends base, installs c8 + drops a graceful-shutdown shim so `NODE_V8_COVERAGE` flushes on `compose stop` |
| `docker-compose.yml` | mongo:7 + this sample, env-driven (defaults preserve standalone `docker compose up`) |
| `docker-compose.coverage.yml` | overlay; arms `NODE_V8_COVERAGE=/coverage` and bind-mounts the dump dir |
| `coverage-report.js` | reads V8 dumps and emits `Covered N/M (XX.X%)` for the line-coverage gate |
| `flow.sh` | Subcommand traffic driver: `bootstrap | record-traffic | coverage` |
| `keploy.yml.template` | Noise filter for parse-server identifiers (`objectId`, `sessionToken`, `createdAt`, `updatedAt`, `Date` header) |

## flow.sh subcommands

```
flow.sh bootstrap [timeout]   wait for /parse/health, sign up the fixed user,
                              capture session token to /tmp/parse-token-${PARSE_PHASE}.
                              Idempotent: 4xx on already-exists is treated as success.

flow.sh record-traffic        drive the broad parse-server REST + GraphQL surface
                              the recording should capture. Reads the persisted
                              session token.

flow.sh coverage              when run against the coverage overlay, render the
                              JS line coverage from V8 dumps under ./coverage and
                              emit `Covered N/M (XX.X%)`. When run against the
                              base compose (uninstrumented), prints an INFO
                              message and exits 0 so enterprise lanes'
                              `flow.sh coverage || true` calls keep working.
```

### Boot-phase divergence preserved

`bootstrap` + `record-traffic` together still drive the multi-class `_SCHEMA` mutation pattern (GameScore, PlayerStats, Achievement) the focused boot-phase reproducer needs:
- Parse Server runs `find _SCHEMA filter:{}` repeatedly during its boot eager-index sweep.
- `bootstrap` sleeps 3 seconds after `/health` becomes reachable so pre-mutation `find _SCHEMA` snapshots land first.
- `record-traffic` then issues `POST /classes/<NewClass>` for three distinct user-defined classes, each of which lazily inserts the class into `_SCHEMA`, refreshes parse-server's schema cache, and runs `listIndexes` on the new collection. The recording's `find _SCHEMA` mocks span four shapes (system-only + each post-insert state).

At replay, the matcher sees multiple same-shape `find _SCHEMA` candidates with diverging responses. The boot-phase tiebreaker fix in `keploy/integrations` mongo/v2 + `keploy/keploy` mockmanager prefers the earliest candidate and consumes startup-tier mocks on match so the next identical query advances to the next-earliest in chronological order.

## Route surface covered by `record-traffic`

- **Health / config**: `/health`, `/serverInfo`, `/config`
- **Users**: `POST /users` (signup), `GET /users`, `GET /users/me`, `GET/PUT /users/{id}`, `GET /users?where=...`
- **Login / logout**: `GET /login`, `POST /logout`
- **Sessions**: `GET /sessions`, `GET /sessions/me`, `DELETE /sessions/{id}`
- **Classes / objects**: `POST/GET/PUT/DELETE /classes/{class}` and `/classes/{class}/{id}`, query (`where`), count, keys/order/limit
- **Roles**: `GET/POST /roles`, `GET /roles?where=...`
- **Files**: `POST /files/{name}` for text, JSON, and binary content types
- **Cloud functions / jobs**: `POST /functions/{name}`, `POST /jobs/{name}`
- **Schemas**: `GET /schemas`, `GET /schemas/{class}`, `POST/PUT/DELETE /schemas/{class}`
- **Hooks**: `GET/POST /hooks/functions`, `PUT/DELETE /hooks/functions/{name}`, `GET /hooks/triggers`
- **GraphQL**: `POST /graphql` for query, mutation, and introspection
- **Aggregate**: `GET /aggregate/{class}` (skipped silently if upstream doesn't ship it)

## docker-compose env vars

All container names, network name, network subnet, IPs, host:container port and internal `PORT` accept `${VAR:-default}` overrides so concurrent matrix cells can share a docker daemon without colliding:

| Var | Default | Purpose |
|---|---|---|
| `PARSE_PROJECT` | `parse-server-mongo` | top-level compose project name |
| `PARSE_NETWORK_NAME` | `parse-server-mongo-net` | docker network name |
| `PARSE_NETWORK_SUBNET` | `172.30.0.0/24` | network subnet |
| `PARSE_MONGO_IP` | `172.30.0.10` | mongo's static IP |
| `PARSE_APP_IP` | `172.30.0.11` | parse-server's static IP |
| `PARSE_MONGO_CONTAINER` | `parse-server-mongo-mongo` | mongo container name |
| `PARSE_APP_CONTAINER` | `parse-server-mongo-app` | parse-server container name |
| `PARSE_IMAGE` | `parse-server-mongo:local` | built image tag |
| `PARSE_HOST_PORT` | `6100` | host port published to localhost |
| `PARSE_CONTAINER_PORT` | `6100` | port parse-server listens on inside the container |
| `PARSE_MOUNT_PATH` | `/parse` | parse-server mount path |
| `PARSE_APP_ID` | `keploy-parse-app` | `X-Parse-Application-Id` |
| `PARSE_MASTER_KEY` | `keploy-parse-master` | `X-Parse-Master-Key` |
| `PARSE_MASTER_KEY_IPS` | `0.0.0.0/0,::0` | master-key IP allowlist |
| `PARSE_SERVER_URL` | `http://localhost:6100/parse` | public server URL |
| `PARSE_DATABASE_URI` | `mongodb://172.30.0.10:27017/parse` | mongo URI |
| `PARSE_ALLOW_CUSTOM_OBJECT_ID` | `1` | accept caller-supplied `objectId` |

## flow.sh env vars

| Var | Default | Purpose |
|---|---|---|
| `APP_PORT` | `6100` | host port to drive traffic against |
| `PARSE_APP_ID` | `keploy-parse-app` | `X-Parse-Application-Id` |
| `PARSE_MASTER_KEY` | `keploy-parse-master` | `X-Parse-Master-Key` |
| `PARSE_MOUNT_PATH` | `/parse` | mount path on the server |
| `PARSE_PHASE` | `record` | tag — names the persisted token slot `/tmp/parse-token-${PARSE_PHASE}` |
| `PARSE_FIXED_USERNAME` | `keploy-user` | pinned signup username |
| `PARSE_FIXED_PASSWORD` | `KeployPass123!` | pinned signup password |
| `PARSE_FIXED_USER_ID` | `keploy-user-id` | pinned `_User` `objectId` |
| `PARSE_FIXED_SCORE_ID` | `keploy-score-id` | pinned `GameScore` `objectId` |
| `PARSE_FIXED_PLAYER_ID` | `keploy-player-id` | pinned `PlayerStats` `objectId` |
| `PARSE_FIXED_ACHIEVEMENT_ID` | `keploy-achievement-id` | pinned `Achievement` `objectId` |
| `PARSE_TOKEN_FILE` | `/tmp/parse-token-${PARSE_PHASE}` | persisted session token slot |

## keploy.yml.template

`keploy.yml.template` carries the noise filter for parse-server's identifiers:

```yaml
test:
  globalNoise:
    global:
      header.Date: []
      body.objectId: []
      body.sessionToken: []
      body.createdAt: []
      body.updatedAt: []
```

A lane consumer copies this onto the generated `keploy.yml` after `keploy config --generate` so replay assertions ignore the request-scoped fields parse-server mints fresh per call.

## Running locally

### Without keploy — smoke check

```bash
docker compose up -d
bash flow.sh bootstrap 240
bash flow.sh record-traffic
docker compose down -v
```

This is what the keploy/enterprise compat lane wraps in `keploy record` / `keploy test` — the base compose is uninstrumented and runs unchanged inside that lane.

### Without keploy — measuring real JS line coverage

The base image is uninstrumented. Apply the coverage overlay to add c8 / `NODE_V8_COVERAGE` instrumentation:

```bash
mkdir -p coverage
docker compose -f docker-compose.yml -f docker-compose.coverage.yml up -d --build
bash flow.sh bootstrap 240
bash flow.sh record-traffic
docker compose -f docker-compose.yml -f docker-compose.coverage.yml stop -t 30 parse-server
bash flow.sh coverage
docker compose -f docker-compose.yml -f docker-compose.coverage.yml down -v
```

The overlay (`Dockerfile.coverage` + `docker-compose.coverage.yml`) sets `NODE_V8_COVERAGE=/coverage` and replaces the entrypoint with a graceful-shutdown shim so V8 actually flushes coverage data on `compose stop`. `flow.sh coverage` runs the bundled `coverage-report.js` over the V8 dumps. The overlay is consumed ONLY by the standalone GH Actions workflow — keploy/enterprise's compat lane ignores it and runs the base compose, paying zero coverage cost.

### Concurrent matrix cell

```bash
PARSE_PROJECT=cell-A \
  PARSE_HOST_PORT=7100 PARSE_CONTAINER_PORT=7100 \
  PARSE_NETWORK_NAME=parse-cell-A-net \
  PARSE_NETWORK_SUBNET=172.31.0.0/24 \
  PARSE_MONGO_IP=172.31.0.10 PARSE_APP_IP=172.31.0.11 \
  PARSE_MONGO_CONTAINER=parse-cell-A-mongo \
  PARSE_APP_CONTAINER=parse-cell-A-app \
  PARSE_DATABASE_URI=mongodb://172.31.0.10:27017/parse \
  PARSE_SERVER_URL=http://localhost:7100/parse \
  docker compose up -d

APP_PORT=7100 PARSE_PHASE=cell-A bash flow.sh bootstrap 240
APP_PORT=7100 PARSE_PHASE=cell-A bash flow.sh record-traffic
```

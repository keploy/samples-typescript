# parse-server-mongo

Minimal Parse Server + MongoDB sample. Exists primarily as a falsifying e2e reproducer for the mongo/v2 boot-phase candidate-selection bug — a class of bug where an application issues the same query repeatedly during recording while DB state mutates, and the matcher's score-tied tiebreaker at replay picks the wrong same-shape mock.

## Layout

| File | Role |
|---|---|
| `index.js` | 20-line Parse Server bootstrap; reads config from env |
| `package.json` | Pins `parse-server@8.2.3` and `express@4.21.2` |
| `Dockerfile` | `node:20-bookworm-slim` + `npm install --omit=dev` |
| `docker-compose.yml` | mongo:7 + this sample, on a fixed-IP bridge network |
| `flow.sh` | Minimum reproducer traffic — three HTTP calls |

## What the bug is

At boot, Parse Server runs `find _SCHEMA filter:{}` repeatedly during its eager-index sweep. While the recording captures these calls, the recording also drives Parse Server through a `POST /parse/classes/GameScore`, which lazily inserts the `GameScore` user-defined class into `_SCHEMA`. From that point onward, `find _SCHEMA` responses diverge — the early calls captured an empty / system-only `_SCHEMA`, the late ones captured `_SCHEMA` with `GameScore` present.

At replay, the matcher has multiple same-shape candidates with diverging responses. Score-tied tiebreaker decides which one wins. The default tiebreaker picks the candidate closest to `mockWindowMaxReqTimestamp` (the latest recording timestamp), which biases toward late-recording mocks. The booting app then sees post-mutation `_SCHEMA`, takes the steady-state code path, and runs `listIndexes <user-class>` — a query the recording never witnessed, because at record time the user class wasn't in `_SCHEMA` at boot.

The fix (in `keploy/integrations` mongo/v2 + a companion in `keploy/keploy` mockmanager) inverts the tiebreaker at boot phase to prefer the earliest same-shape candidate, and consumes startup-tier mocks on match so the next identical query advances to the next-earliest in chronological order.

## Running locally

```bash
docker compose up -d
bash flow.sh
docker compose down -v
```

## How the e2e lane uses this sample

The `parse-server-mongo` lane in `keploy/integrations` (`.woodpecker/parse-server-mongo.yml`) clones this repo, `cd`s into `parse-server-mongo/`, builds the sample image via `docker compose build`, runs `keploy record -c "docker compose -f docker-compose.yml up"` while `flow.sh` drives the three reproducer calls, then runs `keploy test` for the replay phase. Pass criteria: zero `mongo mock miss`, zero `MongoNetworkError`, zero `ParseError: schema class name does not revalidate` markers in the agent and app logs.

# UI capture sample: plain HTML shop, no bundler

A small shop made of plain HTML pages and JavaScript modules, with no
bundler and no framework, recorded with
[Keploy UI capture](https://keploy.io/docs/running-keploy/ui-capture/). The
browser SDK, `@keploy/capture-sdk`, records what a visitor does and every
request the shop makes. It masks personal data in the browser before
anything leaves it, and posts the recording to Keploy in batches. Keploy
turns each recording into UI flows: the steps the visitor took, with the
network calls each step made.

The shop has five pages (Home, Products with a search box, Cart, Checkout
and About). Each is an HTML file of its own, so every link loads a page. A
`node:http` server ([`server.mjs`](server.mjs)) serves them and the shop's
API. Two sibling samples are the same shop built other ways, with the same
pages, `data-testid`s and `/api` routes:

- [ui-capture-react-shop](../ui-capture-react-shop): React, Vite and React Router
- [ui-capture-next-shop](../ui-capture-next-shop): Next.js App Router

## Run it

You need Node.js 22.22 or later, and a UI ingest key for a Keploy app (see
[Get an ingest key](#get-an-ingest-key)).

```sh
git clone https://github.com/keploy/samples-typescript && cd samples-typescript/ui-capture-html-shop
cp .env.example .env    # then put your ingest key in .env
npm ci
npm start               # http://localhost:8080
```

Open http://localhost:8080 and shop. In the browser's developer tools:

- the console says `[shop] Keploy UI capture is recording session <id>`, a
  new id on every page;
- the Network tab shows a `POST` to `/ui/v1/ingest`, answered `200`.

A session becomes flows once it has been idle for 30 minutes.

## Get an ingest key

A UI ingest key can post recordings into one app and do nothing else, which
is why it is safe in a page every visitor can read. Never put any other
kind of Keploy key in `.env`.

- **In the Keploy dashboard:** open **UI Testing → UI Flows** and select
  your app. On its setup card (the **Setup** tab once the app has flows),
  under **1. Create an ingest key**, click **Create ingest key**. The key
  is shown once: copy it into `.env` as `KEPLOY_INGEST_KEY`.
- **From a script or an AI agent:** `POST /client/v1/apps/<appId>/ui/ingest-keys`
  with a personal access token (the Keploy MCP server's `uiCaptureSetup`
  tool does the same). The response carries the key (`apiKey`) and the
  ingest endpoint to use (`endpoint`).

`.env.example` has the endpoint for keploy.io. A self-hosted Keploy takes
`<your API server URL>/ui/v1/ingest`.

## Without a bundler

The SDK has no script-tag build: it is an ES module that imports `rrweb` by
name. Without a bundler:

- the server serves the SDK's `dist/` directory as npm installed it, at
  `/vendor/capture-sdk/`, and the page imports `dist/index.mjs` from there
  ([`app/keploy.js`](app/keploy.js)). The SDK loads its other files (its
  body redaction code and its Web Worker) from beside `index.mjs`, so serve
  the whole directory, not `index.mjs` alone;
- every page has an import map that says where `rrweb` is
  (`/vendor/rrweb/rrweb.js`, rrweb's own `dist/`). `package.json` lists
  `rrweb` itself, at a version inside the SDK's own `rrweb` range, so npm
  installs one copy, at `node_modules/rrweb`;
- every page loads `app/keploy.js` with a script tag of its own, marked
  `async`, so the page's own script neither imports it nor waits for it.

```html
<script type="importmap">
  { "imports": { "rrweb": "/vendor/rrweb/rrweb.js" } }
</script>
<script type="module" async src="/app/keploy.js"></script>
```

The endpoint and key come from `.env`: the server answers
`/keploy-config.js` with them, and `app/keploy.js` imports it. On your own
static site, write them into your `keploy.js` instead.

## One session per page load

Every page here is a page load, and every page load starts the SDK afresh
with a session of its own. So each session holds one page, its flows are
that page's, and none spans two pages. A single-page app (the React and
Next.js shops) records a whole visit as one session.

## See flows now: scripted visits

`npm run demo:visits` drives five visits through the shop in a headless
Chromium, 15 page loads in all. It reads the endpoint and key from `.env`.
Keploy turns each page's session into flows once it has been idle for 30
minutes.

The React and Next.js shops' scripts mark each visit complete at once
(`POST /ui/v1/sessions/<sessionId>/complete`). This one does not: a page
that is left sends its last events as it unloads, and no script can tell
when those have arrived. A session completed before they arrive would
lose them.

```sh
npx playwright install chromium   # once
npm run demo:visits               # while npm start is running
```

Each visit is printed with its sessions, one per page:

```
visit 3/5: / > /about -- sessions 5f0c…, 9a41… sent
```

About 30 minutes later, open the app in the dashboard: its flows are on the
**Flows** tab. `SHOP_URL` points the script at another address.
`DEMO_DWELL_MS` and `DEMO_GAP_MS` set its pace: by default it stays six
seconds on each page.

The visits type only made-up data: the catalogue word `kettle` and the
address `shopper@example.com`.

## How the SDK is set up

- [`app/keploy.js`](app/keploy.js) calls `KeployCapture.init()` once per
  page load, with the endpoint and key and the privacy settings below. Its
  `onError` ignores `KUI_E_CAPTURE_DECLINED`, which only means the
  visitor's browser sends Do Not Track or Global Privacy Control (the SDK
  then records nothing).
- [`app/scripted-visits.js`](app/scripted-visits.js) lets a scripted visit
  (one that sets `window.keployScriptedVisit` before the page loads) end the
  capture with `KeployCapture.stop()` and read the session id. On any other
  visit it does nothing. Your own site does not need it.

`init()` records the page's requests once it has loaded rrweb. A request
the page makes while rrweb is still loading is not recorded. Every page
load starts the SDK afresh, so on each page the request the page makes as
it loads is usually missing from its recording; `npm test` prints whether
it made it. The shop does not hold its own requests back until the capture
is recording, because that would make every page wait for rrweb. The
scripted visits wait on each page until the capture is recording before
they act.

## What is recorded, and what is not

With `privacyMode: "balanced"` (the default, written out in `app/keploy.js`):

- What the shopper types is masked, one asterisk per character: the
  search word and the email at checkout.
- The page's visible text is kept, except where `app/keploy.js` says
  otherwise:
  - `maskSelectors` masks the order confirmation, because it repeats the
    email the shopper typed;
  - `blockSelectors` keeps the reviews on the home page out of the
    recording: an empty box of the same size takes their place.
- Requests and responses are recorded with their bodies, redacted. The
  email in the order's body is found by the SDK's built-in detectors and
  recorded as `{"email":"[REDACTED]"}`.
- A query value whose name is not a credential's is kept: the search is
  recorded as `GET /api/products?q=kettle`. `privacyMode: "strict"`
  replaces every query value, masks all visible text and records no body.

## Test it without a Keploy account

```sh
npx playwright install chromium   # once
npm test
```

`npm test` serves the shop on port 8081 for a local fake ingest
([`test/fake-ingest.mjs`](test/fake-ingest.mjs)), so it needs no key. It
visits the shop in Chromium and checks what the SDK sent:

- the batches carry the SDK version `package.json` pins;
- one session per page load, each with its page and its clicks, and every
  request made once the capture was recording (the test prints whether
  each page's own load request made it too);
- typed values are asterisks, and the email, the reviewers' names and the
  key appear nowhere in what was sent;
- `npm run demo:visits` records every page of every visit whole.

CI runs it on every change to this folder:
[`.github/workflows/ui-capture-html-shop.yml`](../.github/workflows/ui-capture-html-shop.yml).

## Files

| Path | What it is |
| --- | --- |
| `app/keploy.js` | the SDK's setup |
| `app/scripted-visits.js` | the scripted visits' hook |
| `pages/` | the shop's pages, one HTML file each |
| `app/` | the pages' scripts and style |
| `server.mjs` | the server: pages, scripts, the SDK's and rrweb's `dist/`, `/keploy-config.js` and the API |
| `shop-api.mjs` | the shop's API, in memory |
| `scripts/demo-visits.mjs`, `scripts/visits.mjs` | the scripted visits |
| `test/` | the smoke test and the fake ingest |

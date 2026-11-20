# UI capture sample: Next.js shop

A small shop built with the Next.js App Router, recorded with
[Keploy UI capture](https://keploy.io/docs/running-keploy/ui-capture/). The
browser SDK, `@keploy/capture-sdk`, records what a visitor does and every
request the shop makes from the browser. It masks personal data in the
browser before anything leaves it, and posts the recording to Keploy in
batches. Keploy turns each visit into UI flows: the steps the visitor took,
with the network calls each step made.

The shop has five pages (Home, Products with a search box, Cart, Checkout
and About), and its API is a Next.js route handler, so there is nothing
else to start. Two sibling samples are the same shop built other ways, with
the same pages, `data-testid`s and `/api` routes:

- [ui-capture-react-shop](../ui-capture-react-shop): React, Vite and React Router
- [ui-capture-html-shop](../ui-capture-html-shop): plain HTML pages, no bundler

## Run it

You need Node.js 22.22 or later, and a UI ingest key for a Keploy app (see
[Get an ingest key](#get-an-ingest-key)).

```sh
git clone https://github.com/keploy/samples-typescript && cd samples-typescript/ui-capture-next-shop
cp .env.example .env    # then put your ingest key in .env
npm ci
npm run dev             # http://localhost:3000
```

`npm run build && npm start` serves the production build on the same
address. The endpoint and key are `NEXT_PUBLIC_` variables, which Next.js
writes into the page when it builds it, so build again after changing them.

Open http://localhost:3000 and shop. In the browser's developer tools:

- the console says `[shop] Keploy UI capture is recording session <id>`;
- while you click around, the Network tab shows a `POST` to
  `/ui/v1/ingest` every few seconds, answered `200`.

A visit becomes flows once it has been idle for 30 minutes. To see flows
sooner, end visits with the scripted visits below.

## Get an ingest key

A UI ingest key can post recordings into one app and do nothing else, which
is why it is safe in a page every visitor can read. Never put any other
kind of Keploy key in `.env`.

- **In the Keploy dashboard:** open **UI Testing → UI Flows** and select
  your app. On its setup card (the **Setup** tab once the app has flows),
  under **1. Create an ingest key**, click **Create ingest key**. The key
  is shown once: copy it into `.env` as `NEXT_PUBLIC_KEPLOY_INGEST_KEY`.
- **From a script or an AI agent:** `POST /client/v1/apps/<appId>/ui/ingest-keys`
  with a personal access token (the Keploy MCP server's `uiCaptureSetup`
  tool does the same). The response carries the key (`apiKey`) and the
  ingest endpoint to use (`endpoint`).

`.env.example` has the endpoint for keploy.io. A self-hosted Keploy takes
`<your API server URL>/ui/v1/ingest`.

## See flows now: scripted visits

`npm run demo:visits` drives five visits through the shop in a headless
Chromium. It ends each visit and marks it complete
(`POST /ui/v1/sessions/<sessionId>/complete`, with the key), so Keploy turns
it into flows within a minute or two instead of after 30 idle minutes. It
reads the endpoint and key from `.env`.

It visits the production build. Under `npm run dev`, React's development
checks (`StrictMode`, on by default in the App Router) make every request
twice, and the recording would show both.

```sh
npm run build && npm start        # http://localhost:3000
npx playwright install chromium   # once, in a second terminal
npm run demo:visits
```

Each visit is printed with its session:

```
visit 1/5: / > /products > /cart > /checkout -- session 5f0c… completed
```

Then open the app in the dashboard: its flows are on the **Flows** tab.
`SHOP_URL` points the script at another address. `DEMO_DWELL_MS` and
`DEMO_GAP_MS` set its pace: by default it stays six seconds on each page,
so that each page's calls stay in that page's flow.

The visits type only made-up data: the catalogue word `kettle` and the
address `shopper@example.com`.

## How the SDK is set up

- [`lib/keploy.ts`](lib/keploy.ts) calls `KeployCapture.init()` once, in
  the browser, with the endpoint and key from `.env` and the privacy
  settings below. Its `onError` ignores `KUI_E_CAPTURE_DECLINED`, which only
  means the visitor's browser sends Do Not Track or Global Privacy Control
  (the SDK then records nothing). On the server, where Next.js renders the
  pages too, it does nothing.
- [`instrumentation-client.ts`](instrumentation-client.ts) imports it.
  Next.js runs that file in the browser before the app hydrates.
- [`lib/scripted-visits.ts`](lib/scripted-visits.ts) lets a scripted visit
  (one that sets `window.keployScriptedVisit` before the page loads) end the
  capture with `KeployCapture.stop()` and read the session id. On any other
  visit it does nothing. Your own app does not need it.

`init()` records the page's requests once it has loaded rrweb, a chunk of
its own. A request the page makes while that chunk is still loading is not
recorded. Starting it from `instrumentation-client.ts` starts that load
before the app hydrates. The shop does not hold its own requests back until
the capture is recording, because that would make every visit wait for
rrweb. So the first page's first request (`GET /api/featured`) may be
missing from a recording; `npm test` prints whether it made it. The
scripted visits wait on each page until the capture is recording before
they act.

The SDK records the requests the browser makes. The pages here are client
components that fetch their data in the browser; a fetch that a server
component makes runs on the server and is not part of the recording.
Next.js's own requests from the browser are recorded too: a `<Link>`
fetches its page's server component payload (`GET /products?_rsc=…`) ahead
of time as it prefetches, or when it is followed.

A route change is not a page load here, so one visit is one session, and
each route change is recorded with what moved the page (`cause: "push"` for
a link).

## What is recorded, and what is not

With `privacyMode: "balanced"` (the default, written out in `lib/keploy.ts`):

- What the shopper types is masked, one asterisk per character: the
  search word and the email at checkout.
- The page's visible text is kept, except where `lib/keploy.ts` says
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

`npm test` builds the shop into `.next-test/` for a local fake ingest
([`test/fake-ingest.mjs`](test/fake-ingest.mjs)), so it needs no key and
never replaces your own `.next/`. It visits the shop in Chromium and checks
what the SDK sent:

- the batches carry the SDK version `package.json` pins;
- every page, route change and click of the visit is recorded, and every
  request made once the capture was recording (the test prints whether the
  first page's own request made it too);
- typed values are asterisks, and the email, the reviewers' names and the
  key appear nowhere in what was sent;
- `npm run demo:visits` records every visit whole and completes each one
  after its last batch.

CI runs it on every change to this folder:
[`.github/workflows/ui-capture-next-shop.yml`](../.github/workflows/ui-capture-next-shop.yml).

## Files

| Path | What it is |
| --- | --- |
| `instrumentation-client.ts`, `lib/keploy.ts` | the SDK's setup |
| `lib/scripted-visits.ts` | the scripted visits' hook |
| `lib/api.ts`, `lib/useApi.ts` | the shop's calls to its API |
| `app/` | the shop's pages and layout |
| `shop-api.mjs` | the shop's API, in memory; `app/api/[...path]/route.ts` serves it under `/api` |
| `scripts/demo-visits.mjs`, `scripts/visits.mjs` | the scripted visits |
| `test/` | the smoke test and the fake ingest |

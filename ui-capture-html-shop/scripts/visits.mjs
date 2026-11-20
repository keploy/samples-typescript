// Scripted visits to the shop, shared by `npm run demo:visits` and the smoke
// test (test/shop.spec.mjs). The three UI capture sample shops have the same
// pages, data-testids and /api routes, so this file is the same in each.
//
// Only synthetic data is typed: a catalogue word and an example.com address.

export const SEARCH_WORD = "kettle";
export const SHOPPER_EMAIL = "shopper@example.com";

/**
 * The steps a visit is made of. A page step arrives on a page: "home" opens
 * the shop, the others follow a link (`link`, a data-testid), and each waits
 * for the page's content (`ready`). An action step does something on the
 * page it is on, with `clicks` clicks.
 */
export const STEPS = {
  home: { kind: "page", path: "/", ready: "featured-product" },
  products: { kind: "page", path: "/products", link: "nav-products", ready: "product-2" },
  cart: { kind: "page", path: "/cart", link: "nav-cart", ready: "cart-items" },
  checkout: { kind: "page", path: "/checkout", link: "checkout-link", ready: "email-input" },
  about: { kind: "page", path: "/about", link: "nav-about", ready: "about" },
  search: {
    kind: "action",
    clicks: 1,
    async run(page) {
      await page.getByTestId("search-input").fill(SEARCH_WORD);
      await page.getByTestId("search-button").click();
      // Only the kettle is left once the search has answered.
      await page.getByTestId("product-2").waitFor({ state: "detached" });
    },
  },
  addKettle: {
    kind: "action",
    clicks: 1,
    async run(page) {
      await page.getByTestId("add-to-cart-1").click();
      await page.getByTestId("cart-status").waitFor();
    },
  },
  placeOrder: {
    kind: "action",
    clicks: 1,
    async run(page) {
      await page.getByTestId("email-input").fill(SHOPPER_EMAIL);
      await page.getByTestId("place-order").click();
      await page.getByTestId("order-confirmation").waitFor();
    },
  },
};

/** The paths a shopper takes through the shop: five visits. */
export const VISITS = [
  ["home", "products", "search", "addKettle", "cart", "checkout", "placeOrder"],
  ["home", "products", "search", "addKettle", "cart", "checkout", "placeOrder"],
  ["home", "about"],
  ["home", "products", "search"],
  ["home", "products", "addKettle", "cart"],
];

/** The pages a visit goes through, in order: ["/", "/products", "/cart"]. */
export function pagePaths(visit) {
  return visit.filter((name) => STEPS[name].kind === "page").map((name) => STEPS[name].path);
}

/** The same, for printing: "/ > /products > /cart". */
export function pagesOf(visit) {
  return pagePaths(visit).join(" > ");
}

/**
 * How many clicks each of a visit's sessions records: one session for a
 * single-page app, one per page for a site whose links load pages. A click
 * on a link counts on the page it leaves.
 */
export function clicksPerSession(visit, { multiPage = false } = {}) {
  const counts = [];
  for (const name of visit) {
    const step = STEPS[name];
    if (step.kind === "action") counts[counts.length - 1] += step.clicks;
    else {
      if (step.link) counts[counts.length - 1] += 1;
      if (!step.link || multiPage) counts.push(0);
    }
  }
  return counts;
}

/**
 * Makes a browser context's pages scripted visits: the shop's
 * scripted-visits module then lets `leave` end the capture. Call it before
 * the context opens a page.
 */
export async function prepare(context) {
  await context.addInitScript(() => {
    window.keployScriptedVisit = true;
  });
}

// What the shop's keploy module logs once the capture is recording.
const RECORDING = "[shop] Keploy UI capture is recording session ";

/** The id of the session the page's capture is recording, once it is. */
function recording(page) {
  return page
    .waitForEvent("console", { predicate: (m) => m.text().startsWith(RECORDING), timeout: 30_000 })
    .then((m) => m.text().slice(RECORDING.length).trim());
}

/**
 * Walks one visit and returns its session ids: one for a single-page app,
 * one per page load for a site whose links load pages (`multiPage`).
 *
 * After each page load the visit waits until the capture is recording
 * before it acts: what a page does before init() has loaded rrweb is not
 * recorded at all, and a person reading the page gives it that time too.
 *
 * `dwellMs` is how long the visit stays on each page it arrives on before
 * acting, and `gapMs` the pause after each action, so that the recording
 * reads like a person's. Keploy gives a flow the calls made from one second
 * before its first action to five seconds after its last, so a dwell over
 * five seconds keeps each page's calls in its own flow.
 */
export async function walk(page, visit, { dwellMs = 0, gapMs = 0, multiPage = false } = {}) {
  const sessions = [];
  for (const name of visit) {
    const step = STEPS[name];
    if (step.kind === "action") {
      await step.run(page);
      if (gapMs > 0) await page.waitForTimeout(gapMs);
      continue;
    }
    const started = !step.link || multiPage ? recording(page) : null;
    if (step.link) await page.getByTestId(step.link).click();
    else await page.goto(step.path);
    await page.getByTestId(step.ready).waitFor();
    if (started) sessions.push(await started);
    if (dwellMs > 0) await page.waitForTimeout(dwellMs);
  }
  return sessions;
}

/**
 * Ends the visit on the page it is on, through the shop's scripted-visits
 * module: KeployCapture.stop() sends what the SDK still holds, and this
 * resolves once that has been answered. Returns the session's id.
 */
export async function leave(page) {
  await page.waitForFunction(() => window.keployDemo !== undefined);
  return page.evaluate(() => window.keployDemo.end());
}

/**
 * Tells Keploy a session is over, so it turns the session into flows now
 * rather than after it has been idle for 30 minutes.
 */
export async function complete(endpoint, apiKey, sessionId) {
  const url = endpoint.replace(/\/ingest\/?$/, `/sessions/${encodeURIComponent(sessionId)}/complete`);
  const response = await fetch(url, { method: "POST", headers: { "X-API-Key": apiKey } });
  if (!response.ok) {
    throw new Error(`completing session ${sessionId}: HTTP ${response.status} ${await response.text()}`);
  }
}

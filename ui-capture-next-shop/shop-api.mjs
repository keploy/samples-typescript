// The shop's whole backend: a fixed catalogue and one cart, kept in memory
// and served under /api. There is no database, so the sample runs anywhere;
// every visitor shares the one cart, and placing an order empties it.
//
// The three UI capture sample shops (React, Next.js and plain HTML) serve
// this same file, so their recorded calls look the same.

/** @typedef {{ id: number, name: string, price: number }} Product */

/** @type {Product[]} */
const products = [
  { id: 1, name: "Kettle", price: 30 },
  { id: 2, name: "Teapot", price: 45 },
  { id: 3, name: "Mug", price: 8 },
  { id: 4, name: "Tea tin", price: 12 },
];

/** @type {{ productId: number, quantity: number }[]} */
let cart = [];
let nextOrder = 1001;

function cartView() {
  const items = cart.map(({ productId, quantity }) => ({
    product: /** @type {Product} */ (products.find((p) => p.id === productId)),
    quantity,
  }));
  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  return { items, total };
}

/** @param {string} raw */
function parse(raw) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return null;
  }
}

/**
 * Answers one request to /api.
 *
 * @param {string} method
 * @param {URL} url
 * @param {string} rawBody the request body as text ("" when there is none)
 * @returns {{ status: number, body: unknown }}
 */
export function handleApi(method, url, rawBody) {
  const body = parse(rawBody);
  if (body === null) return { status: 400, body: { error: "the body is not JSON" } };

  switch (`${method} ${url.pathname}`) {
    case "GET /api/featured":
      return { status: 200, body: { product: products[0] } };

    case "GET /api/products": {
      const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
      return {
        status: 200,
        body: { products: products.filter((p) => p.name.toLowerCase().includes(q)) },
      };
    }

    case "GET /api/cart":
      return { status: 200, body: cartView() };

    case "POST /api/cart": {
      const product = products.find((p) => p.id === body.productId);
      if (!product) return { status: 400, body: { error: "unknown productId" } };
      const line = cart.find((l) => l.productId === product.id);
      if (line) line.quantity += 1;
      else cart.push({ productId: product.id, quantity: 1 });
      return { status: 201, body: cartView() };
    }

    case "POST /api/orders": {
      if (typeof body.email !== "string" || !body.email.includes("@"))
        return { status: 400, body: { error: "an email for the receipt is required" } };
      if (cart.length === 0) return { status: 409, body: { error: "the cart is empty" } };
      const { total } = cartView();
      cart = [];
      return { status: 201, body: { orderId: `ord-${nextOrder++}`, total } };
    }

    case "GET /api/about":
      return {
        status: 200,
        body: { name: "Demo Shop", founded: 2024, sells: "kettles, teapots and mugs" },
      };

    default:
      return { status: 404, body: { error: "not found" } };
  }
}

import { api, post } from "./api.js";
import { h, showError } from "./dom.js";

async function add(product) {
  try {
    await post("/api/cart", { productId: product.id });
    document
      .querySelector("#cart-status")
      .replaceChildren(h("p", { "data-testid": "cart-status" }, `${product.name} is in your cart.`));
  } catch (err) {
    showError(err);
  }
}

async function load(query) {
  try {
    const { products } = await api(query ? `/api/products?q=${encodeURIComponent(query)}` : "/api/products");
    const rows = products.map((product) =>
      h(
        "li",
        { "data-testid": `product-${product.id}` },
        h("span", {}, `${product.name} `, h("strong", {}, `$${product.price}`)),
        h("button", { "data-testid": `add-to-cart-${product.id}`, onclick: () => add(product) }, "Add to cart"),
      ),
    );
    document
      .querySelector("#products")
      .replaceChildren(h("ul", { class: "products", "data-testid": "product-list" }, ...rows));
  } catch (err) {
    showError(err);
  }
}

document.querySelector("form[role=search]").addEventListener("submit", (event) => {
  event.preventDefault();
  void load(String(new FormData(event.currentTarget).get("q") ?? "").trim());
});
await load("");

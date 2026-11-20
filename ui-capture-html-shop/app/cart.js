import { api } from "./api.js";
import { h, showError } from "./dom.js";

try {
  const { items, total } = await api("/api/cart");
  const slot = document.querySelector("#cart");
  if (items.length === 0) {
    slot.replaceChildren(h("p", { "data-testid": "cart-empty" }, "Your cart is empty."));
  } else {
    slot.replaceChildren(
      h(
        "ul",
        { class: "products", "data-testid": "cart-items" },
        ...items.map(({ product, quantity }) => h("li", {}, `${product.name} × ${quantity}`)),
      ),
      h("p", {}, `Total: $${total}`),
      h("a", { href: "/checkout", class: "button", "data-testid": "checkout-link" }, "Checkout"),
    );
  }
} catch (err) {
  showError(err);
}

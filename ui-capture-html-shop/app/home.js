import { api } from "./api.js";
import { h, showError } from "./dom.js";

try {
  const { product } = await api("/api/featured");
  document.querySelector("#featured").replaceChildren(
    h(
      "section",
      { class: "card", "data-testid": "featured-product" },
      h("h2", {}, `Featured: ${product.name}`),
      h("p", {}, `$${product.price}`),
    ),
  );
} catch (err) {
  showError(err);
}

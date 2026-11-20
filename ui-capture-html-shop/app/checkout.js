import { api, post } from "./api.js";
import { h, showError } from "./dom.js";

async function placeOrder(event) {
  event.preventDefault();
  const email = String(new FormData(event.currentTarget).get("email") ?? "");
  try {
    const { orderId, total } = await post("/api/orders", { email });
    // Masked in the recording: keploy.js lists it in maskSelectors, since it shows the email.
    document
      .querySelector("main")
      .replaceChildren(
        h(
          "p",
          { class: "card", "data-testid": "order-confirmation" },
          `Order ${orderId} is placed ($${total}). The receipt goes to ${email}.`,
        ),
      );
  } catch (err) {
    showError(err);
  }
}

try {
  const { items, total } = await api("/api/cart");
  document.querySelector("#checkout").replaceChildren(
    h(
      "form",
      { class: "card", onsubmit: placeOrder },
      h("p", {}, `${items.length} ${items.length === 1 ? "item" : "items"}, $${total}`),
      h(
        "label",
        {},
        "Email for the receipt",
        h("input", { name: "email", type: "email", required: "", "data-testid": "email-input" }),
      ),
      h("button", { "data-testid": "place-order" }, "Place order"),
    ),
  );
} catch (err) {
  showError(err);
}

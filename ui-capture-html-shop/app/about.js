import { api } from "./api.js";
import { h, showError } from "./dom.js";

try {
  const { name, founded, sells } = await api("/api/about");
  document
    .querySelector("#about")
    .replaceChildren(
      h(
        "p",
        { class: "card", "data-testid": "about" },
        `${name} has sold ${sells} since ${founded}. It is a sample app: nothing here is for sale.`,
      ),
    );
} catch (err) {
  showError(err);
}

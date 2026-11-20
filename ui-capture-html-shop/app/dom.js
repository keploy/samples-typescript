/**
 * Builds an element: h("p", { class: "card" }, "text", child). An "on..."
 * attribute is added as an event listener instead.
 */
export function h(tag, attributes = {}, ...children) {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (name.startsWith("on")) element.addEventListener(name.slice(2), value);
    else element.setAttribute(name, value);
  }
  element.append(...children);
  return element;
}

/** Shows what went wrong, under the page's content. */
export function showError(err) {
  document.querySelector("main").append(h("p", { class: "error" }, err.message));
}

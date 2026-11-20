import { useState, type FormEvent } from "react";
import { post, type Cart, type Product } from "../api";
import { useApi } from "../useApi";

export default function Products() {
  const [query, setQuery] = useState("");
  const [added, setAdded] = useState("");
  const path = query ? `/api/products?q=${encodeURIComponent(query)}` : "/api/products";
  const { data, error } = useApi<{ products: Product[] }>(path);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(String(new FormData(event.currentTarget).get("q") ?? "").trim());
  }

  async function add(product: Product) {
    await post<Cart>("/api/cart", { productId: product.id });
    setAdded(product.name);
  }

  return (
    <>
      <h1>Products</h1>
      <form role="search" onSubmit={search}>
        <input name="q" type="search" placeholder="Search the catalogue" data-testid="search-input" />
        <button data-testid="search-button">Search</button>
      </form>
      {error && <p className="error">{error}</p>}
      {data && (
        <ul className="products" data-testid="product-list">
          {data.products.map((product) => (
            <li key={product.id} data-testid={`product-${product.id}`}>
              <span>
                {product.name} <strong>${product.price}</strong>
              </span>
              <button data-testid={`add-to-cart-${product.id}`} onClick={() => void add(product)}>
                Add to cart
              </button>
            </li>
          ))}
        </ul>
      )}
      {added && <p data-testid="cart-status">{added} is in your cart.</p>}
    </>
  );
}

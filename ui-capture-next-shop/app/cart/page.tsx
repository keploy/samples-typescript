"use client";

import Link from "next/link";
import type { Cart as CartData } from "../../lib/api";
import { useApi } from "../../lib/useApi";

export default function Cart() {
  const { data, error } = useApi<CartData>("/api/cart");
  return (
    <>
      <h1>Cart</h1>
      {error && <p className="error">{error}</p>}
      {data && data.items.length === 0 && <p data-testid="cart-empty">Your cart is empty.</p>}
      {data && data.items.length > 0 && (
        <>
          <ul className="products" data-testid="cart-items">
            {data.items.map(({ product, quantity }) => (
              <li key={product.id}>
                {product.name} × {quantity}
              </li>
            ))}
          </ul>
          <p>Total: ${data.total}</p>
          <Link href="/checkout" className="button" data-testid="checkout-link">
            Checkout
          </Link>
        </>
      )}
    </>
  );
}

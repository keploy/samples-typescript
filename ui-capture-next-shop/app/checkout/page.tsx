"use client";

import { useState, type FormEvent } from "react";
import { post, type Cart } from "../../lib/api";
import { useApi } from "../../lib/useApi";

type Order = { orderId: string; total: number; email: string };

export default function Checkout() {
  const { data, error } = useApi<Cart>("/api/cart");
  const [order, setOrder] = useState<Order | null>(null);
  const [orderError, setOrderError] = useState("");

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    try {
      const placed = await post<{ orderId: string; total: number }>("/api/orders", { email });
      setOrder({ ...placed, email });
    } catch (err) {
      setOrderError((err as Error).message);
    }
  }

  if (order) {
    // Masked in the recording: lib/keploy.ts lists it in maskSelectors, since it shows the email.
    return (
      <p className="card" data-testid="order-confirmation">
        Order {order.orderId} is placed (${order.total}). The receipt goes to {order.email}.
      </p>
    );
  }
  return (
    <>
      <h1>Checkout</h1>
      {(error || orderError) && <p className="error">{error || orderError}</p>}
      {data && (
        <form className="card" onSubmit={placeOrder}>
          <p>
            {data.items.length} {data.items.length === 1 ? "item" : "items"}, ${data.total}
          </p>
          <label>
            Email for the receipt
            <input name="email" type="email" required data-testid="email-input" />
          </label>
          <button data-testid="place-order">Place order</button>
        </form>
      )}
    </>
  );
}

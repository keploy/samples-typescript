"use client";

import type { Product } from "../lib/api";
import { useApi } from "../lib/useApi";

export default function Home() {
  const { data, error } = useApi<{ product: Product }>("/api/featured");
  return (
    <>
      <h1>Kettles, teapots and mugs</h1>
      {error && <p className="error">{error}</p>}
      {data && (
        <section className="card" data-testid="featured-product">
          <h2>Featured: {data.product.name}</h2>
          <p>${data.product.price}</p>
        </section>
      )}
      {/* Never recorded: lib/keploy.ts lists this block in blockSelectors. */}
      <section className="reviews" data-testid="reviews">
        <h2>What shoppers say</h2>
        <blockquote>
          “Boils in two minutes.” <cite>Riley Example</cite>
        </blockquote>
        <blockquote>
          “The mug is just the right size.” <cite>Sam Sample</cite>
        </blockquote>
      </section>
    </>
  );
}

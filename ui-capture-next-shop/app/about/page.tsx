"use client";

import { useApi } from "../../lib/useApi";

type AboutData = { name: string; founded: number; sells: string };

export default function About() {
  const { data, error } = useApi<AboutData>("/api/about");
  return (
    <>
      <h1>About</h1>
      {error && <p className="error">{error}</p>}
      {data && (
        <p className="card" data-testid="about">
          {data.name} has sold {data.sells} since {data.founded}. It is a sample app: nothing here is for sale.
        </p>
      )}
    </>
  );
}

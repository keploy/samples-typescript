export type Product = { id: number; name: string; price: number };
export type Cart = { items: { product: Product; quantity: number }[]; total: number };

/** Calls the shop's API. */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) throw new Error(`${init?.method ?? "GET"} ${path}: HTTP ${response.status}`);
  return (await response.json()) as T;
}

export function post<T>(path: string, body: unknown): Promise<T> {
  return api<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

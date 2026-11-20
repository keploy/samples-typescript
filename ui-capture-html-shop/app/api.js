/** Calls the shop's API. */
export async function api(path, init) {
  const response = await fetch(path, init);
  if (!response.ok) throw new Error(`${init?.method ?? "GET"} ${path}: HTTP ${response.status}`);
  return response.json();
}

export function post(path, body) {
  return api(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

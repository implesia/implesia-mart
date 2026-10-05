/** Public storefront calls stay anonymous. An admin session is not attached. */
export function publicRequestInit(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers);
  headers.delete("Authorization");
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  return { ...init, headers, cache: "no-store", credentials: "omit" };
}

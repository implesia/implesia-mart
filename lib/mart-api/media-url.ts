/** Same value as `MART_API_URL`, kept here so light modules do not import the whole API client. */
export const API_BASE_URL = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";
const API = API_BASE_URL;

/** A catalog or blog image path the storefront may render; "" when it is not safe. */
export function mediaUrl(src: string) {
  const value = src.trim();
  if (!value || value.includes("..") || value.startsWith("//")) return "";
  if (value.startsWith("/")) {
    return value.startsWith("/media/") ? `${API}${value}` : value;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.href;
  } catch {
    return "";
  }
}

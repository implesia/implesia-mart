// HTTP Strict Transport Security for the storefront host only. No includeSubDomains
// (other implesia.com hosts are not ours to pin) and no preload (hard to undo).
// Sent only on HTTPS responses for a public host; browsers ignore it over HTTP.
export const HSTS_VALUE = "max-age=31536000";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function wantsHsts(url: URL, forwardedProto: string | null) {
  if (LOCAL_HOSTS.has(url.hostname)) return false;
  const proto = forwardedProto?.split(",")[0]?.trim().toLowerCase();
  return proto ? proto === "https" : url.protocol === "https:";
}

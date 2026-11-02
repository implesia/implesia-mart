/** YouTube links in the product gallery. The API runs the same check and stores only the id. */

const ID = /^[A-Za-z0-9_-]{11}$/;
const HOSTS = new Set(["youtube.com", "youtube-nocookie.com", "youtu.be"]);
const PATHS = new Set(["shorts", "embed", "live", "v"]);

/** The 11-character id from a watch, youtu.be, shorts, or embed link (or a bare id); else "". */
export function youtubeId(link: string): string {
  const text = link.trim();
  if (ID.test(text)) return text;
  if (!text || text.length > 300 || /\s/.test(text)) return "";
  let url: URL;
  try {
    url = new URL(text.includes("://") ? text : `https://${text}`);
  } catch {
    return "";
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return "";
  const host = url.hostname.toLowerCase().replace(/^(www|m|music)\./, "");
  if (!HOSTS.has(host)) return "";
  const parts = url.pathname.split("/").filter(Boolean);
  let found = "";
  if (host === "youtu.be") found = parts[0] ?? "";
  else if (parts.length === 1 && parts[0] === "watch") found = url.searchParams.get("v") ?? "";
  else if (parts.length >= 2 && PATHS.has(parts[0]!)) found = parts[1]!;
  return ID.test(found) ? found : "";
}

export function youtubeThumb(id: string) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

/** Privacy-enhanced player: no cookies until the visitor presses play. */
export function youtubeEmbed(id: string) {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
}

/**
 * True when a URL path holds a percent escape that does not decode to valid UTF-8
 * (`%FF`, `%E0%A4%A`, a bare `%`). Next decodes dynamic segments before any page code
 * runs, so such a path used to end in a plain-text 500. The proxy answers it with a 400.
 */
export function hasMalformedPercentEncoding(pathname: string): boolean {
  if (!pathname.includes("%")) return false;
  try {
    decodeURIComponent(pathname);
    return false;
  } catch {
    return true;
  }
}

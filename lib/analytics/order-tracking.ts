/**
 * Browser signals the order request forwards for Meta CAPI.
 * The backend may ignore `tracking`; older servers keep working.
 */

export type OrderTracking = {
  fbp: string | null;
  fbc: string | null;
  event_source_url: string | null;
};

export const EMPTY_ORDER_TRACKING: OrderTracking = {
  fbp: null,
  fbc: null,
  event_source_url: null,
};

const FBCLID_KEY = "implesia.analytics.fbclid";

export function readCookie(cookieHeader: string, name: string): string | null {
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    const raw = part.slice(eq + 1).trim();
    if (!raw) return null;
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
}

export function fbclidFromUrl(href: string): string | null {
  try {
    const id = new URL(href).searchParams.get("fbclid")?.trim();
    return id || null;
  } catch {
    return null;
  }
}

/** Meta click id: `fb.1.<unix ms>.<fbclid>`. */
export function buildFbc(fbclid: string, nowMs: number): string {
  return `fb.1.${nowMs}.${fbclid}`;
}

export function buildOrderTracking(input: {
  cookieHeader?: string | null;
  href?: string | null;
  storedFbclid?: string | null;
  nowMs: number;
}): OrderTracking {
  const cookies = input.cookieHeader ?? "";
  const fbp = readCookie(cookies, "_fbp");
  const fbcCookie = readCookie(cookies, "_fbc");
  const href = input.href?.trim() || "";
  const fbclid = (href ? fbclidFromUrl(href) : null) || input.storedFbclid?.trim() || null;
  const fbc = fbcCookie || (fbclid ? buildFbc(fbclid, input.nowMs) : null);
  let eventSourceUrl: string | null = null;
  if (href) {
    try {
      const url = new URL(href);
      url.hash = "";
      eventSourceUrl = url.toString();
    } catch {
      eventSourceUrl = null;
    }
  }
  return { fbp, fbc, event_source_url: eventSourceUrl };
}

export function rememberFbclid(href: string, storage: Pick<Storage, "setItem">): void {
  const id = fbclidFromUrl(href);
  if (!id) return;
  try {
    storage.setItem(FBCLID_KEY, id);
  } catch {
    /* ignore */
  }
}

export function currentOrderTracking(): OrderTracking {
  if (typeof document === "undefined" || typeof window === "undefined") return EMPTY_ORDER_TRACKING;
  let stored: string | null = null;
  try {
    stored = window.sessionStorage.getItem(FBCLID_KEY);
    rememberFbclid(window.location.href, window.sessionStorage);
    if (!stored) stored = window.sessionStorage.getItem(FBCLID_KEY);
  } catch {
    stored = null;
  }
  try {
    return buildOrderTracking({
      cookieHeader: document.cookie,
      href: window.location.href,
      storedFbclid: stored,
      nowMs: Date.now(),
    });
  } catch {
    return EMPTY_ORDER_TRACKING;
  }
}

export function captureFbclidFromLocation(): void {
  if (typeof window === "undefined") return;
  try {
    rememberFbclid(window.location.href, window.sessionStorage);
  } catch {
    /* ignore */
  }
}

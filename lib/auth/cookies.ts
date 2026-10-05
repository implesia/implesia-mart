export const ACCESS_COOKIE = "implesia_access";
export const REFRESH_COOKIE = "implesia_refresh";

const ACCESS_MAX_AGE = 30 * 60;
const REFRESH_MAX_AGE = 14 * 24 * 60 * 60;

export function sessionCookieOptions(secure: boolean, maxAge: number) {
  return {
    httpOnly: true as const,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function accessCookieOptions(secure: boolean) {
  return sessionCookieOptions(secure, ACCESS_MAX_AGE);
}

export function refreshCookieOptions(secure: boolean) {
  return sessionCookieOptions(secure, REFRESH_MAX_AGE);
}

/** Browser fetches from this site send Origin. Cross-site posts do not match Host. */
export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return request.method === "GET" || request.method === "HEAD";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

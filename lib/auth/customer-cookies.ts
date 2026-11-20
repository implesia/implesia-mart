export const CUSTOMER_ACCESS_COOKIE = "implesia_cust_access";
export const CUSTOMER_REFRESH_COOKIE = "implesia_cust_refresh";

const ACCESS_MAX_AGE = 30 * 60; // 30 minutes
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60; // 30 days for customer mobile convenience

export function customerSessionCookieOptions(secure: boolean, maxAge: number) {
  return {
    httpOnly: true as const,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function customerAccessCookieOptions(secure: boolean) {
  return customerSessionCookieOptions(secure, ACCESS_MAX_AGE);
}

export function customerRefreshCookieOptions(secure: boolean) {
  return customerSessionCookieOptions(secure, REFRESH_MAX_AGE);
}

export function customerClearedCookieOptions(secure: boolean) {
  return customerSessionCookieOptions(secure, 0);
}

/**
 * In-app stand-ins (`lib/mart-mock/*`) for orders, quotes, coupons, order
 * alerts, inventory and reports are allowed only when explicitly opted in:
 *
 * - `next dev` (`NODE_ENV === "development"`), or
 * - `NEXT_PUBLIC_ENABLE_MOCK=true` at build time (never set it in
 *   `wrangler.jsonc` or any production build).
 *
 * Production builds therefore never price, place, or show a fake order, coupon
 * or report. A failed API call surfaces as a real error instead. The per-area
 * `NEXT_PUBLIC_*_MOCK=1` switches only take effect when this returns true.
 *
 * `process.env.*` is read directly so the bundler can inline both values.
 */
export function mockFallbackAllowed(): boolean {
  return process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ENABLE_MOCK === "true";
}

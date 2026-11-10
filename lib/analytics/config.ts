/**
 * Tracker ids come from the environment. An empty or malformed id switches
 * that tracker off: no script tag, no events, no console message.
 *
 * Read with a dynamic lookup. Next.js inlines a direct
 * `process.env.NEXT_PUBLIC_*` access to the value from build time, which
 * would freeze an empty build into the worker. `env[name]` stays a runtime
 * read, so Cloudflare Workers runtime variables apply on the next request.
 */

const GA4_ID = /^G-[A-Za-z0-9]+$/;
const META_PIXEL_ID = /^\d{5,20}$/;

export const ANALYTICS_CONFIG_ELEMENT_ID = "implesia-analytics-config";

export type AnalyticsConfig = {
  ga4Id: string;
  metaPixelId: string;
};

export function readEnvName(
  name: string,
  env: Record<string, string | undefined> = process.env,
): string {
  const value = env[name];
  return typeof value === "string" ? value.trim() : "";
}

/** GA4 measurement id (`G-…`), or "" when unset or not that shape. */
export function validGa4(value: string): string {
  const id = value.trim();
  return GA4_ID.test(id) ? id : "";
}

/** Meta Pixel id (digits only), or "" when unset or not that shape. */
export function validPixel(value: string): string {
  const id = value.trim();
  return META_PIXEL_ID.test(id) ? id : "";
}

export function analyticsConfig(
  env: Record<string, string | undefined> = process.env,
): AnalyticsConfig {
  return {
    ga4Id: validGa4(readEnvName("NEXT_PUBLIC_GA4_ID", env)),
    metaPixelId: validPixel(readEnvName("NEXT_PUBLIC_META_PIXEL_ID", env)),
  };
}

/** True when at least one tracker id is set. */
export function analyticsEnabled(config: AnalyticsConfig): boolean {
  return config.ga4Id.length > 0 || config.metaPixelId.length > 0;
}

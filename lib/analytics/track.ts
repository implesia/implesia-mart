import { browserSinks, configFromDocument } from "@/lib/analytics/browser";
import { analyticsEnabled, type AnalyticsConfig } from "@/lib/analytics/config";
import {
  createEventId,
  mapAnalyticsEvent,
  purchaseEventId,
  type AnalyticsItem,
  type TrackInput,
} from "@/lib/analytics/events";
import { isAdminPath } from "@/lib/analytics/paths";
import { analyticsProviders, type AnalyticsSinks } from "@/lib/analytics/providers";
import { claimPurchase, type PurchaseMemory, type PurchaseStorage } from "@/lib/analytics/purchase-guard";

export type TrackContext = {
  pathname?: string;
  config?: AnalyticsConfig;
  sinks?: AnalyticsSinks;
  storage?: PurchaseStorage;
  /** In-page dedupe set. Production uses one set for the tab; tests pass their own. */
  claimed?: PurchaseMemory;
  randomId?: () => string;
};

const sessionClaims: PurchaseMemory = new Set();

function currentPath(): string {
  if (typeof window === "undefined") return "";
  return window.location.pathname;
}

function browserPurchaseStorage(): PurchaseStorage | undefined {
  try {
    if (typeof window === "undefined") return undefined;
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function resolveConfig(ctx: TrackContext): AnalyticsConfig {
  if (ctx.config) return ctx.config;
  return configFromDocument() ?? { ga4Id: "", metaPixelId: "" };
}

/**
 * Send one event to every enabled provider.
 * No-ops on /admin, when both ids are empty, and on the server.
 * Purchase is sent once per order number (see purchase-guard).
 */
export function track(input: TrackInput, ctx: TrackContext = {}): boolean {
  try {
    const pathname = ctx.pathname ?? currentPath();
    if (isAdminPath(pathname)) return false;
    if (typeof window === "undefined" && !ctx.sinks) return false;

    const config = resolveConfig(ctx);
    if (!analyticsEnabled(config)) return false;

    const eventId =
      input.name === "purchase"
        ? purchaseEventId(input.transactionId, input.analyticsEventId)
        : (ctx.randomId ?? createEventId)();

    if (input.name === "purchase") {
      if (!input.transactionId.trim()) return false;
      const memory = ctx.claimed ?? sessionClaims;
      if (!claimPurchase(input.transactionId, ctx.storage ?? browserPurchaseStorage(), memory)) {
        return false;
      }
    }

    const mapped = mapAnalyticsEvent(input, eventId);
    const sinks = ctx.sinks ?? browserSinks(config);
    for (const provider of analyticsProviders) {
      if (!provider.enabled(config)) continue;
      try {
        provider.send(mapped, sinks);
      } catch {
        /* One provider must not block the other. */
      }
    }
    return true;
  } catch {
    return false;
  }
}

/** Purchase, after the order exists. A repeat of the same order number does not send. */
export function trackPurchase(
  input: {
    orderNumber: string;
    analyticsEventId?: string | null;
    value: number;
    items: AnalyticsItem[];
    /** Coupon code on the order. Sent as GA4 `coupon` and Meta custom data. */
    coupon?: string | null;
  },
  ctx?: TrackContext,
): boolean {
  return track(
    {
      name: "purchase",
      transactionId: input.orderNumber,
      analyticsEventId: input.analyticsEventId,
      value: input.value,
      items: input.items,
      coupon: input.coupon,
    },
    ctx,
  );
}

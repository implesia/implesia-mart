import type { AnalyticsConfig } from "@/lib/analytics/config";
import type { MappedAnalyticsEvent } from "@/lib/analytics/events";

export type AnalyticsSinks = {
  gtag: (command: "event" | "config" | "js", ...args: unknown[]) => void;
  fbq: (
    command: "track" | "init",
    eventName: string,
    params?: Record<string, unknown>,
    options?: { eventID?: string },
  ) => void;
};

/**
 * One provider maps the shared event onto its own API.
 * TikTok or Google Ads can be added by appending another object here.
 * Components never call a provider directly.
 *
 * There is no consent banner. A provider runs when its id is set.
 */
export type AnalyticsProvider = {
  name: string;
  enabled: (config: AnalyticsConfig) => boolean;
  send: (event: MappedAnalyticsEvent, sinks: AnalyticsSinks) => void;
};

export const analyticsProviders: AnalyticsProvider[] = [
  {
    name: "ga4",
    enabled: (config) => config.ga4Id.length > 0,
    send(event, sinks) {
      sinks.gtag("event", event.ga4.name, event.ga4.params);
    },
  },
  {
    name: "meta",
    enabled: (config) => config.metaPixelId.length > 0,
    send(event, sinks) {
      sinks.fbq("track", event.meta.name, event.meta.params, { eventID: event.meta.eventID });
    },
  },
];

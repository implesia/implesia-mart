import { ANALYTICS_CONFIG_ELEMENT_ID, type AnalyticsConfig, validGa4, validPixel } from "@/lib/analytics/config";
import type { AnalyticsSinks } from "@/lib/analytics/providers";

type GtagFn = (...args: unknown[]) => void;

type FbqFn = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  loaded: boolean;
  version: string;
  push: FbqFn;
};

const ga4Configured = new Set<string>();
const metaConfigured = new Set<string>();

// gtag.js and fbevents.js replay `arguments` objects. A rest array is not replayed.
/* eslint-disable prefer-rest-params, prefer-spread */
function installGtag(): GtagFn {
  const w = window as Window & { dataLayer?: unknown[]; gtag?: GtagFn };
  w.dataLayer = w.dataLayer || [];
  if (!w.gtag) {
    w.gtag = function gtag() {
      w.dataLayer?.push(arguments);
    };
  }
  return w.gtag;
}

function installFbq(): FbqFn {
  const w = window as Window & { fbq?: FbqFn; _fbq?: FbqFn };
  if (w.fbq) return w.fbq;
  const queue: unknown[] = [];
  const fbq = function fbq(this: FbqFn) {
    const self = fbq as FbqFn;
    if (typeof self.callMethod === "function") {
      self.callMethod.apply(self, arguments as unknown as unknown[]);
    } else {
      queue.push(arguments);
    }
  } as FbqFn;
  fbq.queue = queue;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.push = fbq;
  w.fbq = fbq;
  if (!w._fbq) w._fbq = fbq;
  return fbq;
}
/* eslint-enable prefer-rest-params, prefer-spread */

/**
 * Install the gtag / fbq queues and configure them once.
 * GA4's automatic page_view is off so the route listener is the only page_view.
 * The Meta snippet does not send PageView; the same listener does.
 */
export function activateTrackers(config: AnalyticsConfig): void {
  if (typeof window === "undefined") return;
  if (config.ga4Id && !ga4Configured.has(config.ga4Id)) {
    const gtag = installGtag();
    gtag("js", new Date());
    gtag("config", config.ga4Id, { send_page_view: false });
    ga4Configured.add(config.ga4Id);
  }
  if (config.metaPixelId && !metaConfigured.has(config.metaPixelId)) {
    installFbq()("init", config.metaPixelId);
    metaConfigured.add(config.metaPixelId);
  }
}

export function browserSinks(config: AnalyticsConfig): AnalyticsSinks {
  return {
    gtag: (command, ...args) => {
      if (typeof window === "undefined" || !config.ga4Id) return;
      activateTrackers(config);
      installGtag()(command, ...args);
    },
    fbq: (command, eventName, params, options) => {
      if (typeof window === "undefined" || !config.metaPixelId) return;
      activateTrackers(config);
      installFbq()(command, eventName, params, options);
    },
  };
}

/** Ids rendered into the storefront HTML by the server. Absent on /admin and when unset. */
export function configFromDocument(): AnalyticsConfig | null {
  if (typeof document === "undefined") return null;
  const node = document.getElementById(ANALYTICS_CONFIG_ELEMENT_ID);
  if (!node) return null;
  return {
    ga4Id: validGa4(node.getAttribute("data-ga4") ?? ""),
    metaPixelId: validPixel(node.getAttribute("data-meta") ?? ""),
  };
}

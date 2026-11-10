/**
 * One event shape for every provider. GA4 keeps the event name; Meta uses
 * the standard Pixel name. Currency is always BDT (the store's currency).
 */

export const CURRENCY = "BDT";

export const META_EVENT_NAME = {
  page_view: "PageView",
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
} as const;

export type AnalyticsEventName = keyof typeof META_EVENT_NAME;

export type AnalyticsItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type EcommerceInput = {
  items: AnalyticsItem[];
  /** Order total when the caller has one (checkout, purchase). Otherwise price × quantity. */
  value?: number;
};

export type TrackInput =
  | {
      name: "page_view";
      pagePath: string;
      pageLocation?: string;
      pageTitle?: string;
    }
  | ({ name: "view_item" | "add_to_cart" | "begin_checkout" } & EcommerceInput)
  | ({
      name: "purchase";
      transactionId: string;
      /** From the order-create response. Used as event_id when it is non-empty. */
      analyticsEventId?: string | null;
    } & EcommerceInput);

export type Ga4Event = {
  name: string;
  params: Record<string, unknown>;
};

export type MetaEvent = {
  name: string;
  params: Record<string, unknown>;
  eventID: string;
};

export type MappedAnalyticsEvent = {
  ga4: Ga4Event;
  meta: MetaEvent;
};

export function createEventId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") return cryptoApi.randomUUID();
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Shared with the backend CAPI call. Prefer `analytics_event_id` from the
 * order response; otherwise `purchase_<order_number>`.
 */
export function purchaseEventId(orderNumber: string, analyticsEventId?: string | null): string {
  const given = analyticsEventId?.trim();
  if (given) return given;
  return `purchase_${orderNumber}`;
}

function eventValue(given: number | undefined, items: AnalyticsItem[]): number {
  if (given !== undefined && Number.isFinite(given)) return given;
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function ga4Items(items: AnalyticsItem[]) {
  return items.map((item) => ({
    item_id: item.id,
    item_name: item.name,
    price: item.price,
    quantity: item.quantity,
  }));
}

function metaContents(items: AnalyticsItem[]) {
  return items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    item_price: item.price,
    item_name: item.name,
  }));
}

function defined(entries: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(entries).filter(([, value]) => value !== undefined));
}

function ecommerceParams(input: EcommerceInput, eventId: string, extra?: Record<string, unknown>) {
  const items = input.items;
  const value = eventValue(input.value, items);
  const ga4 = defined({
    currency: CURRENCY,
    value,
    items: ga4Items(items),
    event_id: eventId,
    ...extra,
  });
  const meta = defined({
    content_ids: items.map((item) => item.id),
    content_type: "product",
    contents: metaContents(items),
    currency: CURRENCY,
    value,
    ...(items.length === 1 ? { content_name: items[0]?.name } : {}),
    ...extra,
  });
  return { ga4, meta };
}

/** Pure mapping. `eventId` is a GA4 param and the Meta `eventID` option. */
export function mapAnalyticsEvent(input: TrackInput, eventId: string): MappedAnalyticsEvent {
  if (input.name === "page_view") {
    return {
      ga4: {
        name: "page_view",
        params: defined({
          page_path: input.pagePath,
          page_location: input.pageLocation,
          page_title: input.pageTitle,
          event_id: eventId,
        }),
      },
      meta: {
        name: META_EVENT_NAME.page_view,
        params: {},
        eventID: eventId,
      },
    };
  }

  const extra =
    input.name === "purchase" ? { transaction_id: input.transactionId } : undefined;
  const params = ecommerceParams(input, eventId, extra);
  return {
    ga4: { name: input.name, params: params.ga4 },
    meta: {
      name: META_EVENT_NAME[input.name],
      params: params.meta,
      eventID: eventId,
    },
  };
}

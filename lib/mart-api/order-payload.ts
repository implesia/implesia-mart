export type DeliveryZoneName = "inside" | "suburban" | "outside";

export type OrderItemRef = {
  productId: string;
  quantity: number;
  selection?: { groupId: string; valueId: string }[];
};

export type QuotePayloadInput = {
  source: "cart" | "direct";
  district: string;
  area?: string;
  deliveryZone?: DeliveryZoneName;
  items?: OrderItemRef[];
};

const CLIENT_MONEY_KEYS = [
  "price",
  "unit_price",
  "line_total",
  "subtotal",
  "shipping",
  "total",
  "discount",
  "delivery_charge",
] as const;

/** Identifiers and address only. The API prices the order. */
export function buildQuotePayload(input: QuotePayloadInput) {
  const body: Record<string, unknown> = {
    source: input.source,
    district: input.district.trim(),
  };
  if (input.area?.trim()) body.area = input.area.trim();
  if (input.deliveryZone) body.delivery_zone = input.deliveryZone;
  if (input.source === "direct") {
    body.items = (input.items ?? []).map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      selection: (item.selection ?? []).map((choice) => ({
        group_id: choice.groupId,
        value_id: choice.valueId,
      })),
    }));
  }
  return body;
}

export function payloadOmitsClientMoney(body: Record<string, unknown>) {
  return CLIENT_MONEY_KEYS.every((key) => !(key in body));
}

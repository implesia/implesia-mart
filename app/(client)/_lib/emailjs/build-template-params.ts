import { formatCartMoney, type CartLineResolved, type CartPricing } from "../cart";

export type CheckoutShippingValues = {
  name: string;
  email: string;
  phone: string;
  district: string;
  area: string;
  address: string;
  notes: string;
};

export type PlaceOrderPayload = {
  shipping: CheckoutShippingValues;
  paymentMethod: string;
  items: CartLineResolved[];
  pricing: CartPricing;
};

function buildOrderItemsText(items: CartLineResolved[]) {
  return items
    .map(
      (item, index) =>
        `${index + 1}. ${item.title} × ${item.quantity} = ${formatCartMoney(item.lineTotal)}`,
    )
    .join("\n");
}

function buildMessage(payload: PlaceOrderPayload) {
  const { shipping, paymentMethod, items, pricing } = payload;

  return [
    "নতুন অর্ডার বিবরণ",
    "",
    `পেমেন্ট: ${paymentMethod}`,
    `ডেলিভারি ঠিকানা: ${shipping.address}`,
    `${shipping.area}, ${shipping.district}`,
    shipping.notes?.trim() ? `নোট: ${shipping.notes.trim()}` : null,
    "",
    "অর্ডার আইটেম:",
    buildOrderItemsText(items),
    "",
    `সাবটোটাল: ${formatCartMoney(pricing.subtotal)}`,
    `ডেলিভারি চার্জ: ${formatCartMoney(pricing.shipping)}`,
    `সর্বমোট: ${formatCartMoney(pricing.total)}`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function formatOrderTime() {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Dhaka",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date());
  } catch {
    return new Date().toLocaleString();
  }
}

/**
 * Variables expected by order-email-template.html
 * (EmailJS Content + Settings → Subject / From / Reply To)
 */
export function buildOrderTemplateParams(payload: PlaceOrderPayload) {
  const { shipping, paymentMethod, items, pricing } = payload;
  const name = shipping.name.trim();
  const phone = shipping.phone.trim();
  const email = shipping.email.trim();
  const replyTo = email || "implesiaitltd@gmail.com";

  return {
    name,
    email: email || "Not provided",
    phone,
    district: shipping.district.trim(),
    area: shipping.area.trim(),
    address: shipping.address.trim(),
    notes: shipping.notes.trim() || "None",
    payment_method: paymentMethod,
    order_items: buildOrderItemsText(items),
    item_count: String(items.reduce((sum, item) => sum + item.quantity, 0)),
    subtotal: formatCartMoney(pricing.subtotal),
    shipping_fee: formatCartMoney(pricing.shipping),
    total: formatCartMoney(pricing.total),
    message: buildMessage(payload),
    source: "Implesia Mart Checkout",
    time: formatOrderTime(),
    from_name: "Implesia Mart",
    from_email: replyTo,
    reply_to: replyTo,
  };
}

export function validateShipping(shipping: CheckoutShippingValues) {
  const errors: Partial<Record<keyof CheckoutShippingValues, string>> = {};

  if (!shipping.name.trim()) errors.name = "নাম লিখুন";
  if (!/^01\d{9}$/.test(shipping.phone.trim())) {
    errors.phone = "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)";
  }
  if (shipping.email.trim()) {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email.trim());
    if (!ok) errors.email = "সঠিক ইমেইল দিন";
  }
  if (!shipping.district.trim()) errors.district = "জেলা লিখুন";
  if (!shipping.area.trim()) errors.area = "এলাকা লিখুন";
  if (shipping.address.trim().length < 8) {
    errors.address = "সম্পূর্ণ ঠিকানা লিখুন";
  }

  return errors;
}

/**
 * WhatsApp order/inquiry link for the product page. Pure: the page passes in the
 * values it already shows (prices come from the API, never from here).
 */

/** Business number for product inquiries, local format. Override with NEXT_PUBLIC_PRODUCT_WHATSAPP_NUMBER. */
export const DEFAULT_PRODUCT_WHATSAPP_NUMBER = "01580569129";

/** Bangladesh mobile number to wa.me international digits, or null when it is not one. */
export function whatsappNumber(value: string | undefined | null) {
  const digits = (value ?? "").replace(/[\s\-().]/g, "").replace(/^\+/, "");
  if (!/^\d+$/.test(digits)) return null;
  if (/^01[3-9]\d{8}$/.test(digits)) return `880${digits.slice(1)}`;
  if (/^8801[3-9]\d{8}$/.test(digits)) return digits;
  return null;
}

export function configuredProductWhatsappNumber() {
  return whatsappNumber(
    process.env.NEXT_PUBLIC_PRODUCT_WHATSAPP_NUMBER || DEFAULT_PRODUCT_WHATSAPP_NUMBER,
  );
}

export type WhatsappProduct = {
  title: string;
  id: string;
  url: string;
  /** Option name and chosen label, e.g. { name: "সাইজ", label: "M" }. */
  selection: { name: string; label: string }[];
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  /** False when the chosen option cannot be bought, or the product is sold out / coming soon. */
  orderable: boolean;
  status: "available" | "sold-out" | "coming-soon";
};

function money(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

export function productWhatsappMessage(p: WhatsappProduct) {
  const lines: string[] = [];
  lines.push(
    p.orderable
      ? "আসসালামু আলাইকুম, আমি এই প্রোডাক্টটি অর্ডার করতে চাই / কিছু জানতে চাই:"
      : "আসসালামু আলাইকুম, এই প্রোডাক্টটি সম্পর্কে জানতে চাই:",
  );
  lines.push(`প্রোডাক্ট: ${p.title}`);
  lines.push(`আইডি: ${p.id}`);
  lines.push(`লিংক: ${p.url}`);
  for (const pick of p.selection) {
    if (pick.name && pick.label) lines.push(`${pick.name}: ${pick.label}`);
  }
  if (p.orderable) {
    lines.push(`পরিমাণ: ${p.quantity}`);
    lines.push(`প্রতিটির দাম: ${money(p.unitPrice)}`);
    lines.push(`আনুমানিক মোট: ${money(p.lineTotal)}`);
    lines.push("দাম ও স্টক নিশ্চিত করে জানাবেন, প্লিজ।");
  } else if (p.status === "sold-out") {
    lines.push("এটি এখন শেষ দেখাচ্ছে। আবার কবে পাওয়া যাবে জানাবেন, প্লিজ।");
  } else if (p.status === "coming-soon") {
    lines.push("এটি শীঘ্রই আসছে দেখাচ্ছে। কবে পাওয়া যাবে জানাবেন, প্লিজ।");
  } else {
    lines.push("এই অপশনটি এখন পাওয়া যাচ্ছে কি না জানাবেন, প্লিজ।");
  }
  return lines.join("\n");
}

export function whatsappHref(number: string, message: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Chosen option labels for the message, in group order. Unknown choices are skipped. */
export function selectionLabels(
  groups: { id: string; name: string; values: { id: string; label: string }[] }[],
  choices: Record<string, string>,
) {
  const out: { name: string; label: string }[] = [];
  for (const group of groups) {
    const value = group.values.find((item) => item.id === choices[group.id]);
    if (value) out.push({ name: group.name, label: value.label });
  }
  return out;
}

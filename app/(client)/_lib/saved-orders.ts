const KEY = "implesia.orders.v1";
const MAX_SAVED = 8;

export type SavedOrder = {
  number: string;
  phone: string;
  name: string;
  placedAt: string;
};

export function orderPhoneDigits(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("880") && digits.length === 13) digits = `0${digits.slice(3)}`;
  return digits;
}

function isSaved(value: unknown): value is SavedOrder {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<SavedOrder>;
  return (
    typeof item.number === "string" &&
    typeof item.phone === "string" &&
    typeof item.name === "string" &&
    typeof item.placedAt === "string"
  );
}

export function readSavedOrders(): SavedOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSaved).slice(0, MAX_SAVED);
  } catch {
    return [];
  }
}

export function rememberOrder(input: {
  number: string;
  phone: string;
  name: string;
  placedAt?: string;
}) {
  const number = input.number.trim().toUpperCase();
  const phone = orderPhoneDigits(input.phone);
  if (!/^IM-[0-9A-F]{8}$/.test(number) || !/^01\d{9}$/.test(phone)) return;
  const next: SavedOrder[] = [
    {
      number,
      phone,
      name: input.name.trim(),
      placedAt: input.placedAt ?? new Date().toISOString(),
    },
    ...readSavedOrders().filter((item) => item.number !== number),
  ].slice(0, MAX_SAVED);
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

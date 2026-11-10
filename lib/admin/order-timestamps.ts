/**
 * Admin `OrderRead.delivered_at` / `returned_at`. The schema is `datetime | None`:
 * JSON is an ISO 8601 string with a UTC offset (`2026-11-09T08:30:00+00:00`) or
 * `null`. Each is set once, on the first transition to that status, and is not
 * replaced later. Admin list, get, patch, and `POST /orders` include both.
 * Public order lookup does not. Display is Asia/Dhaka: "09 Nov 2026, 2:30 PM".
 */

export const MISSING_TIMESTAMP = "—";

const DHAKA = "Asia/Dhaka";

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((item) => item.type === type)?.value ?? "";
}

/** ISO 8601 timestamp, or null when the field is null, missing, or not a date. */
export function readOrderTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return value;
}

/** `09 Nov 2026, 2:30 PM` in Asia/Dhaka, or "—" when there is no timestamp. */
export function formatDhakaDateTime(iso: string | null | undefined) {
  if (iso == null || !iso.trim()) return MISSING_TIMESTAMP;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return MISSING_TIMESTAMP;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DHAKA,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h12",
  }).formatToParts(date);
  const day = part(parts, "day");
  const month = part(parts, "month").replace(/\./g, "");
  const year = part(parts, "year");
  const hourRaw = part(parts, "hour");
  const hour = String(Number(hourRaw));
  const minute = part(parts, "minute").padStart(2, "0");
  const period = part(parts, "dayPeriod").replace(/\./g, "").replace(/\s/g, "").toUpperCase();
  if (!day || !month || !year || !hourRaw || hour === "NaN" || !minute || (period !== "AM" && period !== "PM")) {
    return MISSING_TIMESTAMP;
  }
  return `${day} ${month} ${year}, ${hour}:${minute} ${period}`;
}

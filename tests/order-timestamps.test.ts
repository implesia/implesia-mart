import assert from "node:assert/strict";
import test from "node:test";

import {
  MISSING_TIMESTAMP,
  formatDhakaDateTime,
  readOrderTimestamp,
} from "@/lib/admin/order-timestamps";

test("formats delivered and returned timestamps in Asia/Dhaka", () => {
  // 08:30 UTC is 14:30 in Dhaka (UTC+6, no daylight saving).
  assert.equal(formatDhakaDateTime("2026-11-09T08:30:00.000Z"), "09 Nov 2026, 2:30 PM");
  // FastAPI/Pydantic isoformat of a UTC datetime, the OrderRead JSON shape.
  assert.equal(formatDhakaDateTime("2026-11-09T08:30:00+00:00"), "09 Nov 2026, 2:30 PM");
  assert.equal(formatDhakaDateTime("2026-11-09T00:00:00.000Z"), "09 Nov 2026, 6:00 AM");
  assert.equal(formatDhakaDateTime("2026-11-09T06:00:00.000Z"), "09 Nov 2026, 12:00 PM");
  assert.equal(formatDhakaDateTime("2026-11-08T18:00:00.000Z"), "09 Nov 2026, 12:00 AM");
});

test("missing timestamps render an em dash", () => {
  assert.equal(MISSING_TIMESTAMP, "—");
  assert.equal(formatDhakaDateTime(null), "—");
  assert.equal(formatDhakaDateTime(undefined), "—");
  assert.equal(formatDhakaDateTime(""), "—");
  assert.equal(formatDhakaDateTime("   "), "—");
  assert.equal(formatDhakaDateTime("not-a-date"), "—");
});

test("reads nullable ISO timestamps from the order API", () => {
  assert.equal(readOrderTimestamp("2026-11-09T08:30:00+06:00"), "2026-11-09T08:30:00+06:00");
  // The offset is already Dhaka local time, so this is 8:30 AM, not 2:30 PM.
  assert.equal(formatDhakaDateTime("2026-11-09T08:30:00+06:00"), "09 Nov 2026, 8:30 AM");
  assert.equal(readOrderTimestamp(null), null);
  assert.equal(readOrderTimestamp(undefined), null);
  assert.equal(readOrderTimestamp(""), null);
  assert.equal(readOrderTimestamp("yesterday"), null);
});

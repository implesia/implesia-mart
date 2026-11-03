import assert from "node:assert/strict";
import test from "node:test";

import { payloadOmitsClientMoney } from "../lib/mart-api/order-payload.ts";
import {
  ADVANCE_PERCENTS,
  advanceOptionsFrom,
  advanceSplit,
  buildPaymentPayload,
  isAdvancePercent,
  normalizePaymentReference,
  paymentReferenceError,
  paymentSettingsFrom,
} from "../lib/payment.ts";

test("advance is rounded up to whole taka and the rest is due on delivery", () => {
  assert.deepEqual(advanceSplit(1001, 25), { advance: 251, due: 750 });
  assert.deepEqual(advanceSplit(1001, 50), { advance: 501, due: 500 });
  assert.deepEqual(advanceSplit(1001, 75), { advance: 751, due: 250 });
  assert.deepEqual(advanceSplit(1001, 100), { advance: 1001, due: 0 });
  assert.deepEqual(advanceSplit(1000, 25), { advance: 250, due: 750 });
  assert.deepEqual(advanceSplit(0, 50), { advance: 0, due: 0 });
  for (const percent of ADVANCE_PERCENTS) {
    const { advance, due } = advanceSplit(1129, percent);
    assert.equal(advance + due, 1129);
  }
});

test("only 25, 50, 75 and 100 are advance choices", () => {
  assert.equal(isAdvancePercent(25), true);
  assert.equal(isAdvancePercent(30), false);
  assert.equal(isAdvancePercent("50"), false);
  assert.deepEqual(
    advanceOptionsFrom([
      { percent: 25, advance: 251, due: 750 },
      { percent: 30, advance: 1, due: 1 },
      { percent: 50, advance: "x", due: 1 },
    ]),
    [{ percent: 25, advance: 251, due: 750 }],
  );
  assert.deepEqual(advanceOptionsFrom(undefined), []);
});

test("no QR set means the QR is hidden", () => {
  assert.deepEqual(paymentSettingsFrom({ bangla_qr_src: null }), { qrSrc: null });
  assert.deepEqual(paymentSettingsFrom(null), { qrSrc: null });
  assert.deepEqual(paymentSettingsFrom({ bangla_qr_src: "javascript:alert(1)" }), { qrSrc: null });
  const set = paymentSettingsFrom({ bangla_qr_src: "/media/payment/qr.png" });
  assert.ok(set.qrSrc?.endsWith("/media/payment/qr.png"));
});

test("transaction ID / sender number is required and checked", () => {
  assert.notEqual(paymentReferenceError(""), "");
  assert.notEqual(paymentReferenceError("   "), "");
  assert.notEqual(paymentReferenceError("<b>"), "");
  assert.notEqual(paymentReferenceError("ab"), "");
  assert.equal(paymentReferenceError("8N7A6D5C4B"), "");
  assert.equal(paymentReferenceError("017 1234 5678"), "");
  assert.equal(normalizePaymentReference(" 017 1234 5678 "), "01712345678");
});

test("payment payload sends the choice, never an amount", () => {
  assert.deepEqual(buildPaymentPayload({ method: "cod" }), { payment_method: "cod" });
  const qr = buildPaymentPayload({ method: "bangla_qr", advancePercent: 75, reference: " TX 99 88 " });
  assert.deepEqual(qr, { payment_method: "bangla_qr", advance_percent: 75, payment_reference: "TX9988" });
  assert.equal(payloadOmitsClientMoney(qr), true);
  assert.equal("advance_amount" in qr || "due_amount" in qr, false);
});

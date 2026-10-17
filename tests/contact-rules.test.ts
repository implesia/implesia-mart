import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CONTACT_ERRORS,
  composeWhatsAppMessage,
  copyValueFor,
  normalizePhone,
  openStatus,
  parseDays,
  parseSchedule,
  parseTime,
  validateContact,
  whatsAppChatHref,
} from "@/lib/contact/contact-rules";

const HOURS = [
  { label: "শনি – বৃহস্পতি", value: "সকাল ৯টা – রাত ১০টা" },
  { label: "শুক্রবার", value: "দুপুর ২টা – রাত ১০টা" },
];

// Dhaka is UTC+6 with no DST.
const dhaka = (iso: string) => new Date(`${iso}+06:00`);

test("phone accepts Bengali digits, +88 and dashes; rejects bad numbers", () => {
  assert.equal(normalizePhone("০১৭১২-৩৪৫৬৭৮"), "01712345678");
  assert.equal(normalizePhone("+880 1712 345678"), "01712345678");
  assert.equal(normalizePhone("01212345678"), null);
  assert.equal(normalizePhone("12345"), null);
});

test("every field is optional, but phone or message is needed and filled fields must be valid", () => {
  assert.deepEqual(validateContact({ name: "", phone: "", subject: "", message: "" }), { message: CONTACT_ERRORS.empty });
  assert.deepEqual(validateContact({ name: "", phone: "01712345678", subject: "", message: "" }), {});
  assert.deepEqual(validateContact({ name: "", phone: "", subject: "", message: "প্রশ্ন" }), {});
  assert.deepEqual(validateContact({ name: "", phone: "123", subject: "", message: "x" }), { phone: CONTACT_ERRORS.phone });
  assert.equal(
    validateContact({ name: "n".repeat(81), phone: "", subject: "", message: "x".repeat(1001) }).message,
    CONTACT_ERRORS.messageLong,
  );
});

test("WhatsApp hand-off keeps the CMS number and encodes the composed message", () => {
  const text = composeWhatsAppMessage({ name: "রহিম", phone: "০১৭১২৩৪৫৬৭৮", subject: "ডেলিভারি", message: "কবে পাব?" });
  assert.match(text, /ফোন: 01712345678/);
  const href = whatsAppChatHref("https://wa.me/8801516527932?text=hi", text);
  assert.ok(href.startsWith("https://wa.me/8801516527932?text="));
  assert.equal(decodeURIComponent(href.split("text=")[1]), text);
  assert.equal(whatsAppChatHref("tel:+880", text), "");
});

test("copy values come from mailto, tel and wa.me links only", () => {
  assert.equal(copyValueFor("mailto:a@b.com", "a@b.com"), "a@b.com");
  assert.equal(copyValueFor("tel:+8801516527932", "+880 1516-527932"), "+8801516527932");
  assert.equal(copyValueFor("https://wa.me/8801516527932?text=x", "x"), "+8801516527932");
  assert.equal(copyValueFor("/shipping-returns", "সারাদেশে ৬৪ জেলা"), null);
});

test("day labels and Bengali times parse; ambiguous text does not", () => {
  assert.deepEqual(parseDays("শনি – বৃহস্পতি"), [6, 0, 1, 2, 3, 4]);
  assert.deepEqual(parseDays("শুক্রবার"), [5]);
  assert.equal(parseDays("ছুটির দিন"), null);
  assert.equal(parseTime("সকাল ৯টা"), 9 * 60);
  assert.equal(parseTime("রাত ১০টা"), 22 * 60);
  assert.equal(parseTime("দুপুর ২:৩০"), 14 * 60 + 30);
  assert.equal(parseTime("9:30 pm"), 21 * 60 + 30);
  assert.equal(parseTime("৯টা"), null);
});

test("schedule is all-or-nothing", () => {
  assert.equal(parseSchedule(HOURS)?.length, 2);
  assert.equal(parseSchedule([...HOURS, { label: "ঈদ", value: "বন্ধ থাকবে" }]), null);
  assert.equal(parseSchedule([{ label: "সবসময়", value: "যেকোনো সময় মেসেজ দিন" }]), null);
  assert.equal(parseSchedule([]), null);
});

test("open status uses Asia/Dhaka time regardless of the machine zone", () => {
  const rules = parseSchedule(HOURS)!;
  // 2026-10-15 is a Thursday.
  assert.deepEqual(openStatus(rules, dhaka("2026-10-15T09:00:00")), { open: true, todayIndex: 0 });
  assert.deepEqual(openStatus(rules, dhaka("2026-10-15T08:59:00")), { open: false, todayIndex: 0 });
  assert.deepEqual(openStatus(rules, dhaka("2026-10-15T22:00:00")), { open: false, todayIndex: 0 });
  // Friday 10:00 closed, 15:00 open.
  assert.deepEqual(openStatus(rules, dhaka("2026-10-16T10:00:00")), { open: false, todayIndex: 1 });
  assert.deepEqual(openStatus(rules, dhaka("2026-10-16T15:00:00")), { open: true, todayIndex: 1 });
  // 03:30 UTC Friday = 09:30 Dhaka Friday → closed (Friday opens 14:00).
  assert.equal(openStatus(rules, new Date("2026-10-16T03:30:00Z")).open, false);
});

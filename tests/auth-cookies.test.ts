import assert from "node:assert/strict";
import test from "node:test";

import {
  accessCookieOptions,
  clearedCookieOptions,
  isSameOrigin,
  refreshCookieOptions,
} from "../lib/auth/cookies.ts";

test("session cookies are httpOnly and lax", () => {
  const access = accessCookieOptions(true);
  const refresh = refreshCookieOptions(true);
  assert.equal(access.httpOnly, true);
  assert.equal(access.secure, true);
  assert.equal(access.sameSite, "lax");
  assert.equal(refresh.httpOnly, true);
  assert.ok(refresh.maxAge > access.maxAge);
});

test("local http keeps the secure flag off", () => {
  assert.equal(accessCookieOptions(false).secure, false);
});

test("logout expires the same httpOnly cookie", () => {
  const cleared = clearedCookieOptions(true);
  assert.equal(cleared.httpOnly, true);
  assert.equal(cleared.secure, true);
  assert.equal(cleared.sameSite, "lax");
  assert.equal(cleared.path, "/");
  assert.equal(cleared.maxAge, 0);
});

test("cross-site posts are rejected", () => {
  const cross = new Request("https://mart.implesia.com/api/auth/login", {
    method: "POST",
    headers: { origin: "https://evil.example", host: "mart.implesia.com" },
  });
  const same = new Request("https://mart.implesia.com/api/auth/login", {
    method: "POST",
    headers: { origin: "https://mart.implesia.com", host: "mart.implesia.com" },
  });
  assert.equal(isSameOrigin(cross), false);
  assert.equal(isSameOrigin(same), true);
});

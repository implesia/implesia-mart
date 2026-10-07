import assert from "node:assert/strict";
import test from "node:test";

import {
  exchangeRefreshToken,
  shareRefresh,
} from "../lib/auth/refresh.ts";

test("a refresh response with both tokens becomes a new pair", async () => {
  const calls: string[] = [];
  const pair = await exchangeRefreshToken(
    "old-refresh",
    async (url, init) => {
      calls.push(url);
      assert.equal(JSON.parse(init.body).refresh_token, "old-refresh");
      return {
        ok: true,
        json: async () => ({
          access_token: "next-access",
          refresh_token: "next-refresh",
        }),
      };
    },
    "http://mart-api.test",
  );
  assert.deepEqual(pair, { access: "next-access", refresh: "next-refresh" });
  assert.deepEqual(calls, ["http://mart-api.test/api/v1/auth/refresh"]);
});

test("a rejected or incomplete refresh is not a session", async () => {
  const rejected = await exchangeRefreshToken(
    "old-refresh",
    async () => ({ ok: false, json: async () => ({}) }),
    "http://mart-api.test",
  );
  const incomplete = await exchangeRefreshToken(
    "old-refresh",
    async () => ({
      ok: true,
      json: async () => ({ access_token: "only-access" }),
    }),
    "http://mart-api.test",
  );
  const offline = await exchangeRefreshToken(
    "old-refresh",
    async () => {
      throw new Error("offline");
    },
    "http://mart-api.test",
  );
  assert.equal(rejected, null);
  assert.equal(incomplete, null);
  assert.equal(offline, null);
});

test("parallel refreshes of one token share a single exchange", async () => {
  let calls = 0;
  const jobs = new Map<string, Promise<string | null>>();
  const run = () =>
    shareRefresh(jobs, "same-token", async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return "next-access";
    });
  const [first, second] = await Promise.all([run(), run()]);
  assert.equal(first, "next-access");
  assert.equal(second, "next-access");
  assert.equal(calls, 1);
});

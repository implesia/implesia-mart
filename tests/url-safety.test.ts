import assert from "node:assert/strict";
import test from "node:test";

import { hasMalformedPercentEncoding } from "../lib/url-safety.ts";

test("accepts ordinary and well-formed encoded paths", () => {
  for (const path of [
    "/",
    "/products/abc-123",
    "/products/%E0%A6%AC%E0%A6%BE%E0%A6%82%E0%A6%B2%E0%A6%BE",
    "/blogs/a%20b",
    "/blogs/100%25",
    "/search",
  ]) {
    assert.equal(hasMalformedPercentEncoding(path), false, path);
  }
});

test("flags escapes that are not valid UTF-8", () => {
  for (const path of ["/products/%FF", "/blogs/%FF", "/products/%E0%A4%A", "/blogs/%", "/blogs/50%", "/x/%C0%AF", "/x/%ZZ"]) {
    assert.equal(hasMalformedPercentEncoding(path), true, path);
  }
});

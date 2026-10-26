import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { FLYOUT_GAP_PX, FLYOUT_MARGIN_PX, placeFlyout, settledAnchor } from "@/lib/category-flyout";

const viewport = { width: 1280, height: 900 };
const size = { width: 240, height: 200 };

test("flyout opens on the right of the row, aligned just above it", () => {
  const spot = placeFlyout({ left: 40, right: 300, top: 300 }, size, viewport);
  assert.deepEqual(spot, { left: 300 + FLYOUT_GAP_PX, top: 300 - FLYOUT_GAP_PX, side: "right" });
});

test("flyout flips to the left of the row when the right side has no room", () => {
  const spot = placeFlyout({ left: 900, right: 1200, top: 300 }, size, viewport);
  assert.equal(spot.side, "left");
  assert.equal(spot.left, 900 - size.width - FLYOUT_GAP_PX);
});

test("flyout is clamped inside the viewport", () => {
  const low = placeFlyout({ left: 40, right: 300, top: 880 }, size, viewport);
  assert.equal(low.top, viewport.height - size.height - FLYOUT_MARGIN_PX);
  const high = placeFlyout({ left: 40, right: 300, top: 0 }, size, viewport);
  assert.equal(high.top, FLYOUT_MARGIN_PX);
  const narrow = placeFlyout({ left: 4, right: 100, top: 100 }, { width: 600, height: 100 }, { width: 400, height: 900 });
  assert.equal(narrow.left, FLYOUT_MARGIN_PX);
});

test("a mid-slide row is anchored at its settled position", () => {
  const anchor = settledAnchor({ left: 548, right: 788, top: 120 }, 3, 0);
  assert.deepEqual(anchor, { left: 545, right: 785, top: 120 });
});

test("flyout motion: slides only opacity/transform, never left/top, and respects reduced motion", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const block = css.slice(css.indexOf(".category-flyout {"));
  assert.match(block, /animation: category-flyout-in 180ms cubic-bezier\(0, 0, 0\.2, 1\) backwards/);
  const frames = block.slice(block.indexOf("@keyframes category-flyout-in"), block.indexOf("@media (prefers-reduced-motion"));
  assert.match(frames, /translate3d\(var\(--flyout-shift\), 0, 0\)/);
  assert.doesNotMatch(frames, /left|top|scale/);
  assert.match(block, /\.category-flyout\[data-side="left"\]\s*\{\s*--flyout-shift: -8px/);
  assert.match(block, /prefers-reduced-motion: reduce\)\s*\{\s*\.category-flyout\s*\{\s*animation: none/);

  const nav = readFileSync(new URL("../app/(client)/_components/home/category-nav.tsx", import.meta.url), "utf8");
  // Regression: `duration-*` on the flyout turned on `transition: all`, animating left/top from (0,0).
  const flyoutClass = nav.slice(nav.indexOf('"category-flyout '), nav.indexOf("wide ?"));
  assert.doesNotMatch(flyoutClass, /duration-|transition|animate-in/);
});

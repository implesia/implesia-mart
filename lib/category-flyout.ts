/**
 * Pure geometry for the desktop category flyouts, kept out of the component so it can be tested.
 *
 * A flyout opens to the right of the row it belongs to. When the viewport has no room it flips to
 * the row's left side. The entrance motion is a small slide towards the row, so its direction
 * follows the side: from the right (positive x offset) when opened on the right, mirrored when
 * flipped. The offset itself lives in CSS (`.category-flyout` in globals.css).
 */

export type FlyoutAnchor = { left: number; right: number; top: number };
export type FlyoutSide = "right" | "left";

export const FLYOUT_GAP_PX = 6;
export const FLYOUT_MARGIN_PX = 8;

export function placeFlyout(
  anchor: FlyoutAnchor,
  size: { width: number; height: number },
  viewport: { width: number; height: number },
): { left: number; top: number; side: FlyoutSide } {
  let side: FlyoutSide = "right";
  let left = anchor.right + FLYOUT_GAP_PX;
  if (left + size.width > viewport.width - FLYOUT_MARGIN_PX) {
    side = "left";
    left = Math.max(FLYOUT_MARGIN_PX, anchor.left - size.width - FLYOUT_GAP_PX);
  }
  left = Math.max(FLYOUT_MARGIN_PX, left);
  let top = anchor.top - FLYOUT_GAP_PX;
  top = Math.min(top, viewport.height - size.height - FLYOUT_MARGIN_PX);
  top = Math.max(FLYOUT_MARGIN_PX, top);
  return { left, top, side };
}

/**
 * A row inside a flyout that is still sliding in is measured offset by the slide. Subtract the
 * flyout's current translate so the next level anchors to the row's settled position and does not
 * end up a few pixels off.
 */
export function settledAnchor(
  rect: { left: number; right: number; top: number },
  offsetX: number,
  offsetY: number,
): FlyoutAnchor {
  return { left: rect.left - offsetX, right: rect.right - offsetX, top: rect.top - offsetY };
}

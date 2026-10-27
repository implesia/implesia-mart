/**
 * What a product card's call-to-action does. Pure (no React), so node:test can load it.
 *
 * - coming-soon:   no purchase action, only a link to the product page.
 * - sold-out:      a disabled button.
 * - choose-on-page: the product has variants, so the shopper must pick one on the product page.
 *                  The card still reads "Add to Cart" (there is no separate Option button).
 * - add:           a single / default-variant product, added straight to the cart.
 *
 * The API stays authoritative for price and stock; this only decides which control to show.
 */
export type CardAction = "sold-out" | "coming-soon" | "choose-on-page" | "add";

export function cardAction(product: {
  status?: string | null;
  hasVariants?: boolean | null;
}): CardAction {
  if (product.status === "coming-soon") return "coming-soon";
  if (product.status === "sold-out") return "sold-out";
  if (product.hasVariants === true) return "choose-on-page";
  return "add";
}

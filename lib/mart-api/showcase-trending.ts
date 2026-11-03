/**
 * The first showcase row (API key `gadgets`, heading set in Admin › Home › Showcase,
 * e.g. "Trending") is the home page Trending strip shown right under the hero.
 * The other rows keep the product-card grid further down the page.
 */
export const TRENDING_ROW_KEY = "gadgets";

type Row = { key: string };

export function splitTrendingRow<T extends Row>(
  section: { rows: T[] } | null,
): { trending: T | null; rest: { rows: T[] } | null } {
  if (!section) return { trending: null, rest: null };
  const trending = section.rows.find((row) => row.key === TRENDING_ROW_KEY) ?? null;
  const others = section.rows.filter((row) => row.key !== TRENDING_ROW_KEY);
  return { trending, rest: others.length > 0 ? { rows: others } : null };
}

import { cleanSearchQuery, searchHref } from "./mart-api/search.ts";

/** A second Enter or click this soon after a submit is the same gesture, not a new search. */
export const SUBMIT_GUARD_MS = 500;

/**
 * Where a submit goes: the highlighted suggestion, else the results page for what was typed,
 * else the full catalog for a blank box.
 */
export function submitTarget(rawQuery: string, chosenHref?: string | null) {
  if (chosenHref) return chosenHref;
  const query = cleanSearchQuery(rawQuery);
  return query ? searchHref(query) : "/products";
}

/** True when a submit repeats the previous one inside the guard window (key repeat, double click). */
export function isRepeatSubmit(lastSubmitAt: number | null, now: number, guardMs = SUBMIT_GUARD_MS) {
  return lastSubmitAt !== null && now - lastSubmitAt >= 0 && now - lastSubmitAt < guardMs;
}

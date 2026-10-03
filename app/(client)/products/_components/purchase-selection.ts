import type { ProductOptionGroup } from "@/lib/mart-mock/product-content";

export type OptionPick = { groupId: string; valueId: string };

const BUY_KEY = "implesia.buy.selection.v1";

let active: OptionPick[] = [];

export function setActivePicks(selection: OptionPick[]) {
  active = selection;
}

export function activePicks() {
  return active;
}

export function defaultPicks(groups: ProductOptionGroup[]): OptionPick[] {
  return groups
    .filter((group) => group.values.length > 0)
    .map((group) => ({ groupId: group.id, valueId: group.values[0].id }));
}

export function picksFromChoices(groups: ProductOptionGroup[], choices: Record<string, string>): OptionPick[] {
  return groups
    .filter((group) => group.values.length > 0)
    .map((group) => {
      const chosen = choices[group.id];
      const value = group.values.find((item) => item.id === chosen) ?? group.values[0];
      return { groupId: group.id, valueId: value.id };
    });
}

export function rememberBuySelection(slug: string, selection: OptionPick[]) {
  window.sessionStorage.setItem(BUY_KEY, JSON.stringify({ slug, selection }));
}

export function readBuySelection(slug: string): OptionPick[] {
  try {
    const raw = window.sessionStorage.getItem(BUY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { slug?: string; selection?: OptionPick[] };
    if (parsed.slug !== slug || !Array.isArray(parsed.selection)) return [];
    return parsed.selection.filter(
      (item) => item && typeof item.groupId === "string" && typeof item.valueId === "string",
    );
  } catch {
    return [];
  }
}

export function optionSummary(selection: { name: string; label: string }[]) {
  return selection.map((item) => `${item.name}: ${item.label}`).join(" · ");
}

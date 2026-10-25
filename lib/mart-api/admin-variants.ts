/**
 * Dashboard helpers for product variants. Pure functions (no React, no Next) so node:test can load
 * them. The API validates everything again; these checks only stop a bad save before it is sent.
 */
import type { ProductOptionGroup } from "../mart-mock/product-content";

export const MAX_VARIANTS = 100;
export const SKU_MAX_LENGTH = 64;

/** A variant as the API stores it. Numbers, not form text. */
export type AdminVariant = {
  id?: string;
  options: Record<string, string>;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  /** null = made to order (no stock limit). */
  quantity: number | null;
  isActive: boolean;
};

/** A variant row in the editor. Text fields, plus a client-only key for React. */
export type VariantRow = {
  key: string;
  id?: string;
  options: Record<string, string>;
  sku: string;
  price: string;
  compareAtPrice: string;
  quantity: string;
  isActive: boolean;
};

export type VariantRowErrors = {
  options?: string;
  sku?: string;
  price?: string;
  compareAtPrice?: string;
  quantity?: string;
};

export type VariantCheck = {
  rows: Record<string, VariantRowErrors>;
  /** Problems that are about the set, not one row. */
  form: string | null;
  ok: boolean;
};

/** The groups a variant can use. Mirrors the API: a group needs a name and at least one value. */
export function usableGroups(groups: ProductOptionGroup[]) {
  return groups.filter((group) => group.name.trim() && group.values.some((value) => value.label.trim()));
}

export function optionKey(options: Record<string, string>) {
  return Object.keys(options)
    .sort()
    .map((groupId) => `${groupId}=${options[groupId]}`)
    .join("|");
}

let counter = 0;
export function newRowKey() {
  counter += 1;
  return `row-${Date.now().toString(36)}-${counter}`;
}

export function rowsFromVariants(variants: AdminVariant[] | undefined): VariantRow[] {
  return (variants ?? []).map((variant) => ({
    key: variant.id ?? newRowKey(),
    id: variant.id,
    options: { ...variant.options },
    sku: variant.sku,
    price: String(variant.price),
    compareAtPrice: variant.compareAtPrice == null ? "" : String(variant.compareAtPrice),
    quantity: variant.quantity == null ? "" : String(variant.quantity),
    isActive: variant.isActive,
  }));
}

/** Every combination of one value per group, in the order the groups and values are listed. */
export function combinations(groups: ProductOptionGroup[]): Record<string, string>[] {
  const usable = usableGroups(groups).map((group) => ({
    id: group.id,
    values: group.values.filter((value) => value.label.trim()),
  }));
  if (usable.length === 0) return [];
  return usable.reduce<Record<string, string>[]>(
    (acc, group) =>
      acc.flatMap((partial) => group.values.map((value) => ({ ...partial, [group.id]: value.id }))),
    [{}],
  );
}

/** Human label such as "M / Red". Values the options no longer have are shown as "?". */
export function variantLabel(groups: ProductOptionGroup[], options: Record<string, string>) {
  return usableGroups(groups)
    .map((group) => group.values.find((value) => value.id === options[group.id])?.label.trim() ?? "?")
    .join(" / ");
}

/**
 * Adds a row for every combination that has none yet, up to the API limit. Existing rows are never
 * changed or reordered, so nothing is duplicated and nothing typed is lost.
 */
export function addMissingRows(
  groups: ProductOptionGroup[],
  rows: VariantRow[],
  defaults: { price: string },
): { rows: VariantRow[]; added: number; truncated: boolean } {
  const have = new Set(rows.map((row) => optionKey(row.options)));
  const next = [...rows];
  let added = 0;
  let truncated = false;
  for (const options of combinations(groups)) {
    if (have.has(optionKey(options))) continue;
    if (next.length >= MAX_VARIANTS) {
      truncated = true;
      break;
    }
    next.push({
      key: newRowKey(),
      options,
      sku: "",
      price: defaults.price,
      compareAtPrice: "",
      quantity: "",
      isActive: true,
    });
    added += 1;
  }
  return { rows: next, added, truncated };
}

function isWhole(text: string) {
  return /^\d+$/.test(text.trim());
}

export function validateVariants(rows: VariantRow[], groups: ProductOptionGroup[]): VariantCheck {
  const usable = usableGroups(groups);
  const errors: Record<string, VariantRowErrors> = {};
  const note = (key: string, field: keyof VariantRowErrors, message: string) => {
    errors[key] = { ...errors[key], [field]: message };
  };
  const seenKeys = new Map<string, string>();
  const seenSkus = new Map<string, string>();

  for (const row of rows) {
    const fits =
      Object.keys(row.options).length === usable.length &&
      usable.every((group) =>
        group.values.some((value) => value.label.trim() && value.id === row.options[group.id]),
      );
    if (!fits) {
      note(row.key, "options", "An option used here was removed. Remove this variant or restore the option.");
    } else {
      const key = optionKey(row.options);
      if (seenKeys.has(key)) note(row.key, "options", "Another variant already has this combination.");
      else seenKeys.set(key, row.key);
    }

    if (!isWhole(row.price)) note(row.key, "price", "Enter the price as a whole number of taka.");
    const price = Number(row.price);
    if (row.compareAtPrice.trim()) {
      if (!isWhole(row.compareAtPrice)) {
        note(row.key, "compareAtPrice", "Whole number, or leave it blank.");
      } else if (isWhole(row.price) && Number(row.compareAtPrice) < price) {
        note(row.key, "compareAtPrice", "Must be at least the price.");
      }
    }
    if (row.quantity.trim() && !isWhole(row.quantity)) {
      note(row.key, "quantity", "Whole number of 0 or more, or blank for made to order.");
    }

    const sku = row.sku.trim();
    if (sku.length > SKU_MAX_LENGTH) note(row.key, "sku", `At most ${SKU_MAX_LENGTH} characters.`);
    else if (/[|=]/.test(sku)) note(row.key, "sku", "Cannot contain | or =.");
    else if (sku) {
      const folded = sku.toLowerCase();
      if (seenSkus.has(folded)) note(row.key, "sku", "Another variant already uses this SKU.");
      else seenSkus.set(folded, row.key);
    }
  }

  let form: string | null = null;
  if (rows.length > MAX_VARIANTS) form = `A product can have at most ${MAX_VARIANTS} variants.`;
  else if (rows.length > 0 && usable.length === 0) {
    form = "Add option values above before keeping variants.";
  }
  return { rows: errors, form, ok: Object.keys(errors).length === 0 && form === null };
}

/** The request body for one variant: only the fields the API accepts. */
export function variantPayload(row: VariantRow) {
  return {
    ...(row.id ? { id: row.id } : {}),
    options: row.options,
    sku: row.sku.trim(),
    price: Number(row.price),
    compare_at_price: row.compareAtPrice.trim() ? Number(row.compareAtPrice) : null,
    quantity: row.quantity.trim() ? Number(row.quantity) : null,
    is_active: row.isActive,
  };
}

export function rowsToVariants(rows: VariantRow[]): AdminVariant[] {
  return rows.map((row) => ({
    id: row.id,
    options: { ...row.options },
    sku: row.sku.trim(),
    price: Number(row.price),
    compareAtPrice: row.compareAtPrice.trim() ? Number(row.compareAtPrice) : null,
    quantity: row.quantity.trim() ? Number(row.quantity) : null,
    isActive: row.isActive,
  }));
}

/** What the product card will show once the API rolls the variants up. Display only. */
export function rollup(rows: VariantRow[]): { price: number | null; quantity: number | null; soldOut: boolean } {
  const priced = rows.filter((row) => isWhole(row.price));
  const active = priced.filter((row) => row.isActive);
  const basis = active.length > 0 ? active : priced;
  const price = basis.length > 0 ? Math.min(...basis.map((row) => Number(row.price))) : null;
  if (active.length === 0) return { price, quantity: 0, soldOut: true };
  if (active.some((row) => !row.quantity.trim())) return { price, quantity: null, soldOut: false };
  const quantity = active.reduce((sum, row) => sum + (isWhole(row.quantity) ? Number(row.quantity) : 0), 0);
  return { price, quantity, soldOut: quantity === 0 };
}

/** Compares what would be sent, ignoring client keys. */
export function sameVariants(a: VariantRow[], b: VariantRow[]) {
  const plain = (rows: VariantRow[]) => JSON.stringify(rows.map((row) => variantPayload(row)));
  return plain(a) === plain(b);
}

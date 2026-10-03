"use client";

import type { ProductOptionGroup } from "@/lib/mart-mock/product-content";
import { cn } from "@/lib/utils";

export function ProductPurchaseOptions({
  groups,
  choices,
  onChoose,
}: {
  groups: ProductOptionGroup[];
  choices: Record<string, string>;
  onChoose: (groupId: string, valueId: string) => void;
}) {
  if (groups.length === 0) return null;

  return (
    <div className="mb-5 flex flex-col gap-4 sm:mb-6">
      {groups.map((group) => {
        const selected = group.values.find((value) => value.id === choices[group.id]) ?? group.values[0];
        return (
          <fieldset key={group.id}>
            <legend className="mb-2 text-sm font-semibold text-on-background">
              {group.name}
              {selected ? <span className="ml-2 font-medium text-on-surface-variant">{selected.label}</span> : null}
            </legend>
            <div className="flex flex-wrap gap-2">
              {group.values.map((value) => {
                const pressed = selected?.id === value.id;
                if (group.kind === "color") {
                  return (
                    <button
                      key={value.id}
                      type="button"
                      aria-pressed={pressed}
                      aria-label={value.label}
                      onClick={() => onChoose(group.id, value.id)}
                      className={cn(
                        "grid size-9 place-items-center rounded-full ring-2 ring-offset-2 transition-shadow",
                        pressed ? "ring-primary" : "ring-transparent hover:ring-neutral-300",
                      )}
                    >
                      <span
                        className="size-7 rounded-full ring-1 ring-black/10"
                        style={{ background: value.swatch || "#d4d4d4" }}
                      />
                    </button>
                  );
                }
                return (
                  <button
                    key={value.id}
                    type="button"
                    aria-pressed={pressed}
                    onClick={() => onChoose(group.id, value.id)}
                    className={cn(
                      "h-9 min-w-9 rounded-full px-3 text-sm font-semibold transition-colors",
                      pressed
                        ? "bg-neutral-950 text-white"
                        : "bg-surface-container text-on-surface hover:bg-neutral-200",
                    )}
                  >
                    {value.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

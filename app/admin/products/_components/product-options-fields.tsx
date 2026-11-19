"use client";

import { useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import type {
  ProductOptionGroup,
  ProductOptionKind,
  ProductStorefrontContent,
} from "@/lib/mart-mock/product-content";
import { cn } from "@/lib/utils";

import { adminFieldClass, FieldLabel } from "../../_components/admin-ui";

const SIZE_PRESETS = ["XS", "S", "M", "L", "XL", "XXL", "ফ্রি"] as const;

function nextId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function group(kind: ProductOptionKind, name: string): ProductOptionGroup {
  return { id: nextId("option"), name, kind, values: [] };
}

export function ProductOptionsFields({
  content,
  onChange,
}: {
  content: ProductStorefrontContent;
  onChange: (content: ProductStorefrontContent) => void;
}) {
  function update(options: ProductOptionGroup[]) {
    onChange({ ...content, options });
  }

  function patch(id: string, next: ProductOptionGroup) {
    update(content.options.map((item) => (item.id === id ? next : item)));
  }

  function addValue(option: ProductOptionGroup, label: string, swatch = "") {
    const text = label.trim();
    if (!text) return;
    if (option.values.some((value) => value.label.toLowerCase() === text.toLowerCase())) return;
    patch(option.id, {
      ...option,
      values: [...option.values, { id: nextId("value"), label: text, swatch }],
    });
  }

  return (
    <div className="space-y-3">
      {/* Add-option toolbar */}
      <div className="flex flex-wrap items-center gap-1.5">
        <AddButton
          icon="palette"
          label="Add color"
          onClick={() => update([...content.options, group("color", "কালার")])}
        />
        <AddButton
          icon="straighten"
          label="Add size"
          onClick={() => update([...content.options, group("size", "সাইজ")])}
        />
        <AddButton
          icon="add"
          label="Add option"
          onClick={() => update([...content.options, group("text", "")])}
        />
      </div>

      {content.options.length === 0 ? (
        <div className="flex items-start gap-2 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 px-3 py-2.5 text-sm text-neutral-500">
          <MaterialIcon
            name="info"
            className="mt-0.5 shrink-0 text-[16px] text-neutral-400"
          />
          <p>
            No choices yet. Add color, size, or another option when the
            customer should pick one.
          </p>
        </div>
      ) : null}

      {content.options.map((option) => (
        <OptionCard
          key={option.id}
          option={option}
          onChange={(next) => patch(option.id, next)}
          onRemove={() =>
            update(content.options.filter((item) => item.id !== option.id))
          }
          onAddValue={addValue}
        />
      ))}
    </div>
  );
}

function OptionCard({
  option,
  onChange,
  onRemove,
  onAddValue,
}: {
  option: ProductOptionGroup;
  onChange: (option: ProductOptionGroup) => void;
  onRemove: () => void;
  onAddValue: (option: ProductOptionGroup, label: string, swatch?: string) => void;
}) {
  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      {/* Header: name input + remove */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <FieldLabel htmlFor={`${option.id}-name`}>
            {option.kind === "color"
              ? "Color name"
              : option.kind === "size"
                ? "Size name"
                : "Option name"}
          </FieldLabel>
          <input
            id={`${option.id}-name`}
            value={option.name}
            onChange={(event) =>
              onChange({ ...option, name: event.target.value })
            }
            placeholder={
              option.kind === "text"
                ? "Such as Material"
                : "Customers see this name"
            }
            className={adminFieldClass}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="mt-[26px] grid size-8 shrink-0 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          aria-label="Remove option"
        >
          <MaterialIcon name="delete" className="text-[18px]" />
        </button>
      </div>

      {/* Values */}
      {option.values.length > 0 ? (
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {option.values.map((value) => (
            <li key={value.id}>
              <span className="group/value inline-flex h-7 items-center gap-1.5 rounded-full bg-white pl-2 pr-1 text-sm font-medium text-neutral-900 ring-1 ring-neutral-200 transition-colors hover:ring-neutral-300">
                {option.kind === "color" && value.swatch ? (
                  <span
                    className="size-3.5 rounded-full ring-1 ring-inset ring-black/10"
                    style={{ background: value.swatch }}
                  />
                ) : null}
                {value.label}
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...option,
                      values: option.values.filter(
                        (item) => item.id !== value.id,
                      ),
                    })
                  }
                  className="grid size-5 place-items-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  aria-label={`Remove ${value.label}`}
                >
                  <MaterialIcon name="close" className="text-[13px]" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2.5 flex items-center gap-1.5 text-xs text-neutral-500">
          <MaterialIcon name="info" className="text-[14px] text-neutral-400" />
          Add at least one value, or this group is not saved.
        </p>
      )}

      <ValueAdder option={option} onAdd={onAddValue} />
    </div>
  );
}

function ValueAdder({
  option,
  onAdd,
}: {
  option: ProductOptionGroup;
  onAdd: (option: ProductOptionGroup, label: string, swatch?: string) => void;
}) {
  const [label, setLabel] = useState("");
  const [swatch, setSwatch] = useState("#111827");

  function add() {
    onAdd(option, label, option.kind === "color" ? swatch : "");
    setLabel("");
    if (option.kind === "color") setSwatch("#111827");
  }

  const isColor = option.kind === "color";
  const isSize = option.kind === "size";
  const canAdd = label.trim().length > 0;

  return (
    <div className="mt-2.5 space-y-2">
      {/* Input row */}
      <div
        className={cn(
          "flex items-stretch gap-1.5 rounded-lg border bg-white p-1 transition-colors",
          "focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15",
          canAdd
            ? "border-neutral-200 shadow-sm"
            : "border-dashed border-neutral-300",
        )}
      >
        {isColor ? (
          <div className="relative shrink-0">
            <input
              type="color"
              value={swatch}
              onChange={(event) => setSwatch(event.target.value)}
              aria-label="Swatch"
              className="peer h-8 w-10 cursor-pointer rounded-md border-0 bg-transparent p-0"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0.5 rounded ring-1 ring-inset ring-black/10 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40"
            />
          </div>
        ) : null}

        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          placeholder={
            isSize ? "Size, such as M" : isColor ? "Color, such as কালো" : "Value"
          }
          aria-label={
            isSize ? "New size value" : isColor ? "New color value" : "New value"
          }
          className="min-w-0 flex-1 rounded-md bg-transparent px-2 text-sm text-neutral-950 outline-none placeholder:text-neutral-400"
        />

        <button
          type="button"
          onClick={add}
          disabled={!canAdd}
          className={cn(
            "inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-md px-3 text-[13px] font-semibold transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1",
            canAdd
              ? "bg-neutral-950 text-white shadow-sm hover:bg-neutral-800 active:scale-[0.97]"
              : "cursor-not-allowed bg-neutral-100 text-neutral-400",
          )}
        >
          <MaterialIcon name="add" className="text-[15px]" />
          Add
        </button>
      </div>

      {/* Size presets */}
      {isSize ? (
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Quick add
          </span>
          {SIZE_PRESETS.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onAdd(option, size)}
              className="group/preset inline-flex h-6 items-center rounded-full bg-neutral-100 px-2 text-[11px] font-semibold text-neutral-700 transition-all hover:bg-neutral-950 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1"
            >
              {size}
              <MaterialIcon
                name="add"
                className="ml-0.5 text-[10px] opacity-0 transition-opacity group-hover/preset:opacity-100"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AddButton({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-800 shadow-sm transition-all hover:-translate-y-px hover:border-neutral-300 hover:bg-neutral-50 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 active:translate-y-0"
    >
      <MaterialIcon name={icon} className="text-[16px] text-neutral-500" />
      {label}
    </button>
  );
}

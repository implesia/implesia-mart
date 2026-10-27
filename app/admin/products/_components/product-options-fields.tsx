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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
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
        <p className="rounded-xl bg-[#f5f6f8] px-3 py-3 text-sm text-neutral-500">
          No choices yet. Add color, size, or another option when the customer should pick one.
        </p>
      ) : null}

      {content.options.map((option) => (
        <OptionCard
          key={option.id}
          option={option}
          onChange={(next) => patch(option.id, next)}
          onRemove={() => update(content.options.filter((item) => item.id !== option.id))}
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
    <div className="rounded-2xl bg-[#f5f6f8] p-3 sm:p-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <FieldLabel htmlFor={`${option.id}-name`}>
            {option.kind === "color" ? "Color name" : option.kind === "size" ? "Size name" : "Option name"}
          </FieldLabel>
          <input
            id={`${option.id}-name`}
            value={option.name}
            onChange={(event) => onChange({ ...option, name: event.target.value })}
            placeholder={option.kind === "text" ? "Such as Material" : "Customers see this name"}
            className={adminFieldClass}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="mt-6 grid size-11 shrink-0 place-items-center rounded-xl text-neutral-500 hover:bg-white hover:text-red-500"
          aria-label="Remove option"
        >
          <MaterialIcon name="delete" className="text-[20px]" />
        </button>
      </div>

      {option.values.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {option.values.map((value) => (
            <li key={value.id}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white py-1 pr-1 pl-2 text-sm font-medium text-neutral-950 ring-1 ring-neutral-200">
                {option.kind === "color" && value.swatch ? (
                  <span
                    className="size-3.5 rounded-full ring-1 ring-neutral-300"
                    style={{ background: value.swatch }}
                  />
                ) : null}
                {value.label}
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...option,
                      values: option.values.filter((item) => item.id !== value.id),
                    })
                  }
                  className="grid size-6 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
                  aria-label={`Remove ${value.label}`}
                >
                  <MaterialIcon name="close" className="text-[14px]" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-neutral-500">Add at least one value, or this group is not saved.</p>
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

  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      {option.kind === "color" ? (
        <input
          type="color"
          value={swatch}
          onChange={(event) => setSwatch(event.target.value)}
          aria-label="Swatch"
          className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-neutral-200 bg-white p-1"
        />
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
        placeholder={option.kind === "size" ? "Size, such as M" : option.kind === "color" ? "Color, such as কালো" : "Value"}
        className={cn(adminFieldClass, "min-w-0 flex-1")}
      />
      <button
        type="button"
        onClick={add}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white"
      >
        Add
      </button>
      {option.kind === "size" ? (
        <div className="flex flex-wrap gap-1.5 sm:hidden">
          {SIZE_PRESETS.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onAdd(option, size)}
              className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 ring-1 ring-neutral-200"
            >
              {size}
            </button>
          ))}
        </div>
      ) : null}
      {option.kind === "size" ? (
        <div className="hidden flex-wrap gap-1.5 sm:flex sm:basis-full">
          {SIZE_PRESETS.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onAdd(option, size)}
              className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 ring-1 ring-neutral-200 hover:ring-neutral-950"
            >
              {size}
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
      className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#f5f6f8] px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-200"
    >
      <MaterialIcon name={icon} className="text-[18px]" />
      {label}
    </button>
  );
}

"use client";

import { useEffect, useId, useState, type FormEvent } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  LOW_STOCK_THRESHOLD,
  adjustmentResultQuantity,
  formatTakaAmount,
  isLowStock,
  parseAdjustmentQuantity,
} from "@/lib/admin/inventory";
import { fetchProductStock, saveStockAdjustment } from "@/lib/mart-api/inventory";
import { MartApiError } from "@/lib/mart-api/products";

import { adminButtonClass, adminFieldClass, FieldLabel } from "../../_components/admin-ui";
import { useAdminNotify } from "../../_components/confirm-delete";
import { InventoryDialog } from "../../inventory/_components/inventory-dialog";
import { useInventoryWriter } from "../../inventory/_components/use-inventory-role";

export type StockOption = {
  id: string;
  label: string;
  sku: string;
  quantity: number | null;
};

export function ProductStockPanel({
  productId,
  productName,
  sku,
  catalogQuantity,
  variants = [],
  onVariantQuantity,
}: {
  productId: string;
  productName: string;
  sku: string;
  catalogQuantity: number | null;
  /** Saved options. Empty for a product that does not track stock per option. */
  variants?: StockOption[];
  onVariantQuantity?: (variantId: string, quantity: number | null) => void;
}) {
  const canWrite = useInventoryWriter();
  const notify = useAdminNotify();
  const [quantity, setQuantity] = useState<number | null>(catalogQuantity);
  const [costPrice, setCostPrice] = useState<number | null>(null);
  const [options, setOptions] = useState<StockOption[] | null>(null);
  const [open, setOpen] = useState(false);
  const shownOptions = options ?? variants;

  useEffect(() => {
    let cancelled = false;
    void fetchProductStock(productId)
      .then((stock) => {
        if (cancelled || !stock) return;
        setQuantity(stock.quantity);
        setCostPrice(stock.costPrice);
        if (stock.hasVariants && stock.variants.length > 0) setOptions(stock.variants);
      })
      .catch(() => {
        /* The catalog quantity stays on screen. */
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const low = isLowStock(quantity);

  return (
    <div className="mb-4 rounded-xl bg-neutral-50 p-4 ring-1 ring-neutral-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-700">Current stock</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-950" data-testid="current-stock">
            {quantity == null ? "Made to order" : quantity}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            Cost price{" "}
            <span className="font-medium text-neutral-950">
              {costPrice == null ? "—" : formatTakaAmount(costPrice)}
            </span>
          </p>
          {shownOptions.length > 0 ? (
            <ul className="mt-3 space-y-1 text-sm text-neutral-700">
              {shownOptions.map((option) => (
                <li key={option.id} className="flex items-baseline justify-between gap-3">
                  <span>
                    {option.label}
                    {option.sku ? <span className="text-neutral-500"> · {option.sku}</span> : null}
                  </span>
                  <span className="font-medium tabular-nums text-neutral-950">
                    {option.quantity == null ? "Made to order" : option.quantity}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {canWrite ? (
          <button type="button" className={adminButtonClass.secondary} onClick={() => setOpen(true)}>
            <MaterialIcon name="tune" className="text-[18px]" />
            Adjust stock
          </button>
        ) : null}
      </div>
      {low ? (
        <p role="status" className="mt-3 rounded-xl bg-warning/10 px-3 py-2 text-sm text-warning ring-1 ring-warning/30">
          Low stock. On-hand is {quantity}, at or below {LOW_STOCK_THRESHOLD}.
        </p>
      ) : null}
      {open ? (
        <AdjustStockDialog
          productId={productId}
          productName={productName}
          sku={sku}
          quantity={quantity}
          options={shownOptions}
          onClose={() => setOpen(false)}
          onSaved={(next, nextCost, nextOptions, message) => {
            setQuantity(next);
            setCostPrice(nextCost);
            if (nextOptions) setOptions(nextOptions);
            setOpen(false);
            notify(message, "ok");
          }}
          onVariantQuantity={onVariantQuantity}
        />
      ) : null}
    </div>
  );
}

function AdjustStockDialog({
  productId,
  productName,
  sku,
  quantity,
  options,
  onClose,
  onSaved,
  onVariantQuantity,
}: {
  productId: string;
  productName: string;
  sku: string;
  quantity: number | null;
  options: StockOption[];
  onClose: () => void;
  onSaved: (
    quantity: number | null,
    costPrice: number | null,
    options: StockOption[] | null,
    message: string,
  ) => void;
  onVariantQuantity?: (variantId: string, quantity: number | null) => void;
}) {
  const titleId = useId();
  const tracksOptions = options.length > 0;
  const [variantId, setVariantId] = useState("");
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<{ variant?: string; quantity?: string; reason?: string }>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const selected = options.find((option) => option.id === variantId) ?? null;
  const held = tracksOptions ? (selected?.quantity ?? null) : quantity;
  const parsed = parseAdjustmentQuantity(delta);
  const next = parsed.ok && (!tracksOptions || selected) ? adjustmentResultQuantity(held, parsed.value) : null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: { variant?: string; quantity?: string; reason?: string } = {};
    const amount = parseAdjustmentQuantity(delta);
    if (tracksOptions && !selected) nextErrors.variant = "Choose an option.";
    if (!amount.ok) nextErrors.quantity = amount.message;
    if (!reason.trim()) nextErrors.reason = "Enter a reason.";
    else if (reason.trim().length > 500) nextErrors.reason = "Reason must be 500 characters or fewer.";
    setErrors(nextErrors);
    if (nextErrors.variant || nextErrors.quantity || nextErrors.reason || !amount.ok) return;
    setBusy(true);
    setFormError("");
    try {
      await saveStockAdjustment({
        productId,
        variantId: tracksOptions ? selected?.id : null,
        quantity: amount.value,
        reason: reason.trim(),
      });
      const stock = await fetchProductStock(productId);
      const nextOptions = stock?.hasVariants ? stock.variants : null;
      const adjusted = nextOptions?.find((option) => option.id === selected?.id);
      if (selected) onVariantQuantity?.(selected.id, adjusted?.quantity ?? null);
      onSaved(
        stock?.quantity ?? quantity,
        stock?.costPrice ?? null,
        nextOptions,
        stock ? "Stock adjusted." : "Stock adjusted. Refresh the product to see the new count.",
      );
    } catch (error) {
      setBusy(false);
      setFormError(error instanceof MartApiError ? error.message : "Could not adjust stock.");
    }
  }

  return (
    <InventoryDialog
      title="Adjust stock"
      titleId={titleId}
      description={
        tracksOptions
          ? `Add or remove on-hand units for one option of ${productName}. A reason is required and is stored on the movement.`
          : `Add or remove on-hand units for ${productName}${sku ? ` (${sku})` : ""}. A reason is required and is stored on the movement.`
      }
      onClose={onClose}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void submit(event);
        }}
        className="space-y-4"
        noValidate
      >
        {tracksOptions ? (
          <div>
            <FieldLabel htmlFor="adjust-variant">Option</FieldLabel>
            <select
              id="adjust-variant"
              value={variantId}
              onChange={(event) => setVariantId(event.target.value)}
              autoFocus
              aria-invalid={errors.variant ? true : undefined}
              className={adminFieldClass}
            >
              <option value="">Choose an option</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                  {option.sku ? ` (${option.sku})` : ""}
                  {option.quantity == null ? "" : ` · ${option.quantity} in stock`}
                </option>
              ))}
            </select>
            {errors.variant ? (
              <p role="alert" className="mt-1.5 text-xs text-error">
                {errors.variant}
              </p>
            ) : null}
          </div>
        ) : null}
        <div>
          <FieldLabel htmlFor="adjust-qty">Quantity change</FieldLabel>
          <input
            id="adjust-qty"
            inputMode="numeric"
            value={delta}
            onChange={(event) => setDelta(event.target.value)}
            autoFocus={!tracksOptions}
            placeholder="For example 5 or -2"
            aria-invalid={errors.quantity ? true : undefined}
            aria-describedby="adjust-qty-hint"
            className={adminFieldClass}
          />
          <p id="adjust-qty-hint" className="mt-1.5 text-xs text-neutral-500">
            {next == null
              ? "Use a positive number to add stock and a negative number to remove it."
              : `On-hand will become ${next}.`}
          </p>
          {errors.quantity ? (
            <p role="alert" className="mt-1.5 text-xs text-error">
              {errors.quantity}
            </p>
          ) : null}
        </div>
        <div>
          <FieldLabel htmlFor="adjust-reason">Reason</FieldLabel>
          <input
            id="adjust-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            aria-invalid={errors.reason ? true : undefined}
            className={adminFieldClass}
          />
          {errors.reason ? (
            <p role="alert" className="mt-1.5 text-xs text-error">
              {errors.reason}
            </p>
          ) : null}
        </div>
        {formError ? (
          <p role="alert" className="text-sm text-error">
            {formError}
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className={adminButtonClass.secondary} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={adminButtonClass.primary} disabled={busy}>
            {busy ? "Saving…" : "Save adjustment"}
          </button>
        </div>
      </form>
    </InventoryDialog>
  );
}

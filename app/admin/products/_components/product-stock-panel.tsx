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

export function ProductStockPanel({
  productId,
  productName,
  sku,
  catalogQuantity,
}: {
  productId: string;
  productName: string;
  sku: string;
  catalogQuantity: number | null;
}) {
  const canWrite = useInventoryWriter();
  const notify = useAdminNotify();
  const [quantity, setQuantity] = useState<number | null>(catalogQuantity);
  const [costPrice, setCostPrice] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchProductStock(productId)
      .then((stock) => {
        if (cancelled || !stock) return;
        setQuantity(stock.quantity);
        setCostPrice(stock.costPrice);
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
          onClose={() => setOpen(false)}
          onSaved={(next, nextCost, message) => {
            setQuantity(next);
            setCostPrice(nextCost);
            setOpen(false);
            notify(message, "ok");
          }}
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
  onClose,
  onSaved,
}: {
  productId: string;
  productName: string;
  sku: string;
  quantity: number | null;
  onClose: () => void;
  onSaved: (quantity: number | null, costPrice: number | null, message: string) => void;
}) {
  const titleId = useId();
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<{ quantity?: string; reason?: string }>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const parsed = parseAdjustmentQuantity(delta);
  const next = parsed.ok ? adjustmentResultQuantity(quantity, parsed.value) : null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: { quantity?: string; reason?: string } = {};
    const amount = parseAdjustmentQuantity(delta);
    if (!amount.ok) nextErrors.quantity = amount.message;
    if (!reason.trim()) nextErrors.reason = "Enter a reason.";
    else if (reason.trim().length > 500) nextErrors.reason = "Reason must be 500 characters or fewer.";
    setErrors(nextErrors);
    if (nextErrors.quantity || nextErrors.reason || !amount.ok) return;
    setBusy(true);
    setFormError("");
    try {
      await saveStockAdjustment({
        productId,
        quantity: amount.value,
        reason: reason.trim(),
      });
      const stock = await fetchProductStock(productId);
      onSaved(
        stock?.quantity ?? quantity,
        stock?.costPrice ?? null,
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
      description={`Add or remove on-hand units for ${productName}${sku ? ` (${sku})` : ""}. A reason is required and is stored on the movement.`}
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
        <div>
          <FieldLabel htmlFor="adjust-qty">Quantity change</FieldLabel>
          <input
            id="adjust-qty"
            inputMode="numeric"
            value={delta}
            onChange={(event) => setDelta(event.target.value)}
            autoFocus
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

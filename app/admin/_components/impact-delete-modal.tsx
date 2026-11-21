"use client";

import { useEffect, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatReportMoney } from "@/lib/admin/reports";
import {
  deleteMartBadge,
  fetchBadgeDeleteImpact,
  type BadgeDeleteImpact,
} from "@/lib/mart-api/badges";
import {
  deleteSupplier,
  fetchSupplierDeleteImpact,
  type SupplierDeleteImpact,
} from "@/lib/mart-api/inventory";
import {
  deleteDeskOrder,
  fetchOrderDeleteImpact,
  type OrderDeleteImpact,
} from "@/lib/mart-api/orders-desk";
import { MartApiError } from "@/lib/mart-api/products";
import { cn } from "@/lib/utils";

import { adminButtonClass, adminFieldClass } from "./admin-ui";
import { useAdminNotify } from "./confirm-delete";

export type ImpactDeleteTarget =
  | { entity: "order"; id: string; label: string }
  | { entity: "badge"; id: string; label: string }
  | { entity: "supplier"; id: string; label: string };

type ImpactData =
  | { kind: "order"; data: OrderDeleteImpact }
  | { kind: "badge"; data: BadgeDeleteImpact }
  | { kind: "supplier"; data: SupplierDeleteImpact };

export function ImpactDeleteModal({
  target,
  onClose,
  onDeleted,
}: {
  target: ImpactDeleteTarget | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  if (!target) return null;
  return (
    <ImpactDeleteModalInner
      key={`${target.entity}:${target.id}`}
      target={target}
      onClose={onClose}
      onDeleted={onDeleted}
    />
  );
}

function ImpactDeleteModalInner({
  target,
  onClose,
  onDeleted,
}: {
  target: ImpactDeleteTarget;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const notify = useAdminNotify();
  const [loaded, setLoaded] = useState<{
    done: boolean;
    impact: ImpactData | null;
    error: string;
  }>({ done: false, impact: null, error: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Order delete state
  const [reconcileStock, setReconcileStock] = useState(true);
  const [orderReason, setOrderReason] = useState("");

  // Badge delete/merge state
  const [badgeMode, setBadgeMode] = useState<"merge" | "unlink">("unlink");
  const [targetBadgeId, setTargetBadgeId] = useState("");

  // Supplier delete/merge/archive state
  const [supplierMode, setSupplierMode] = useState<"merge" | "archive" | "hard_delete">("archive");
  const [targetSupplierId, setTargetSupplierId] = useState("");
  const [unlinkProducts, setUnlinkProducts] = useState(true);
  const [supplierReason, setSupplierReason] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        if (target.entity === "order") {
          const data = await fetchOrderDeleteImpact(target.id);
          if (!active) return;
          setReconcileStock(data.inventoryHeld);
          setLoaded({ done: true, impact: { kind: "order", data }, error: "" });
        } else if (target.entity === "badge") {
          const data = await fetchBadgeDeleteImpact(target.id);
          if (!active) return;
          const defaultTarget = data.availableMergeTargets[0]?.id ?? "";
          setTargetBadgeId(defaultTarget);
          setBadgeMode(data.linkedProductsCount > 0 && defaultTarget ? "merge" : "unlink");
          setLoaded({ done: true, impact: { kind: "badge", data }, error: "" });
        } else {
          const data = await fetchSupplierDeleteImpact(target.id);
          if (!active) return;
          const defaultTarget = data.availableMergeTargets[0]?.id ?? "";
          setTargetSupplierId(defaultTarget);
          setSupplierMode(
            (data.purchasesCount > 0 || data.linkedProductsCount > 0) && defaultTarget
              ? "merge"
              : "archive",
          );
          setLoaded({ done: true, impact: { kind: "supplier", data }, error: "" });
        }
      } catch (reason) {
        if (!active) return;
        setLoaded({
          done: true,
          impact: null,
          error:
            reason instanceof MartApiError
              ? reason.message
              : "Could not load deletion impact. Superadmin privileges are required.",
        });
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [target]);

  const loading = !loaded.done;
  const impact = loaded.impact;
  const loadError = loaded.error;

  async function handleConfirm() {
    if (!target || !impact || submitting) return;
    setSubmitError("");

    if (impact.kind === "order") {
      if (orderReason.trim().length < 3) {
        setSubmitError("Enter a deletion reason (at least 3 characters) for the audit log.");
        return;
      }
      setSubmitting(true);
      try {
        const result = await deleteDeskOrder(target.id, {
          confirm: true,
          reconcileStock,
          reason: orderReason.trim(),
        });
        const parts = [`Order ${result.deletedOrderNumber || target.label} deleted.`];
        if (result.stockRestoredUnits > 0) {
          parts.push(`Restored & reconciled ${result.stockRestoredUnits} stock units.`);
        }
        if (result.couponReleased) parts.push("Coupon redemption released.");
        notify(parts.join(" "), "ok");
        onDeleted();
        onClose();
      } catch (reason) {
        setSubmitError(
          reason instanceof MartApiError ? reason.message : "Could not delete this order.",
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (impact.kind === "badge") {
      if (impact.data.isSystem) {
        setSubmitError("Built-in system badges cannot be deleted.");
        return;
      }
      if (badgeMode === "merge" && !targetBadgeId) {
        setSubmitError("Select a target badge to merge into.");
        return;
      }
      setSubmitting(true);
      try {
        const result = await deleteMartBadge(target.id, {
          mode: badgeMode,
          targetBadgeId: badgeMode === "merge" ? targetBadgeId : null,
        });
        notify(
          result.mode === "merge"
            ? `Merged “${target.label}” across ${result.affectedProductsCount} product(s) and deleted it.`
            : `Deleted “${target.label}” and unlinked ${result.affectedProductsCount} product(s).`,
          "ok",
        );
        onDeleted();
        onClose();
      } catch (reason) {
        setSubmitError(
          reason instanceof MartApiError ? reason.message : "Could not delete this badge.",
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (impact.kind === "supplier") {
      if (supplierMode === "merge" && !targetSupplierId) {
        setSubmitError("Select a target supplier to merge into.");
        return;
      }
      if (supplierMode === "hard_delete" && impact.data.purchasesCount > 0) {
        setSubmitError("Suppliers with purchase history cannot be permanently deleted. Merge or archive instead.");
        return;
      }
      setSubmitting(true);
      try {
        const result = await deleteSupplier(target.id, {
          mode: supplierMode,
          targetSupplierId: supplierMode === "merge" ? targetSupplierId : null,
          reason: supplierReason.trim(),
          unlinkProducts,
        });
        if (result.mode === "merge") {
          notify(
            `Merged “${target.label}”: moved ${result.movedPurchasesCount} purchase(s) and ${result.movedProductsCount} product(s).`,
            "ok",
          );
        } else if (result.mode === "hard_delete") {
          notify(`Permanently deleted supplier “${target.label}”.`, "ok");
        } else {
          notify(
            `Archived supplier “${target.label}”${result.unlinkedProductsCount > 0 ? ` and unlinked ${result.unlinkedProductsCount} product(s)` : ""}.`,
            "ok",
          );
        }
        onDeleted();
        onClose();
      } catch (reason) {
        setSubmitError(
          reason instanceof MartApiError ? reason.message : "Could not delete this supplier.",
        );
      } finally {
        setSubmitting(false);
      }
    }
  }

  const title =
    target?.entity === "order"
      ? `Delete Order ${target.label}`
      : target?.entity === "badge"
        ? `Delete or Merge Badge “${target.label}”`
        : target
          ? `Delete, Merge or Archive Supplier “${target.label}”`
          : "";

  const canSubmit =
    Boolean(impact) &&
    !loading &&
    !submitting &&
    !(impact?.kind === "badge" && impact.data.isSystem) &&
    !(impact?.kind === "order" && orderReason.trim().length < 3) &&
    !(impact?.kind === "badge" && badgeMode === "merge" && !targetBadgeId) &&
    !(impact?.kind === "supplier" && supplierMode === "merge" && !targetSupplierId);

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-white sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-200/80">
              <MaterialIcon name="warning" className="text-[22px]" />
            </span>
            <div>
              <DialogTitle className="text-base font-bold text-slate-950">{title}</DialogTitle>
              <DialogDescription className="mt-1 text-xs leading-relaxed text-slate-500">
                Admin-only safe deletion. Review all affected records and accounting impact before confirming.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            <span className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            Analyzing dependencies and accounting impact…
          </div>
        ) : loadError ? (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {loadError}
          </div>
        ) : impact?.kind === "order" ? (
          <div className="space-y-4">
            {/* Warning card */}
            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold uppercase tracking-wide text-amber-900">
                  Impact &amp; Accounting Summary
                </span>
                <span className="rounded-full bg-white px-2.5 py-0.5 font-semibold text-slate-800 ring-1 ring-amber-200">
                  {impact.data.status} · {impact.data.origin}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-lg bg-white/90 p-2.5 text-center ring-1 ring-amber-200/70 tabular-nums">
                <div>
                  <span className="block text-[10px] uppercase text-slate-400">Total</span>
                  <span className="font-bold text-slate-950">
                    {formatReportMoney(impact.data.total)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-slate-400">Paid</span>
                  <span className="font-bold text-emerald-700">
                    {formatReportMoney(impact.data.paidAmount)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-slate-400">Due</span>
                  <span className="font-bold text-amber-700">
                    {formatReportMoney(impact.data.dueAmount)}
                  </span>
                </div>
              </div>

              <ul className="space-y-1.5 text-xs text-amber-950">
                <li>
                  • <strong>Stock Ledger:</strong>{" "}
                  {impact.data.inventoryHeld
                    ? `${impact.data.stockRestoreItems.reduce((s, i) => s + i.quantity, 0)} unit(s) currently held across ${impact.data.stockRestoreItems.length} line(s) (${impact.data.stockMovementsCount} historical ledger rows).`
                    : `No stock currently held (${impact.data.stockMovementsCount} historical ledger rows preserved with order_id cleared).`}
                </li>
                {impact.data.stockRestoreItems.length > 0 ? (
                  <li className="pl-3 text-[11px] text-amber-900">
                    Items:{" "}
                    {impact.data.stockRestoreItems
                      .map((item) => `${item.title} (×${item.quantity})`)
                      .join(", ")}
                  </li>
                ) : null}
                {impact.data.couponRedemptionCode ? (
                  <li>
                    • <strong>Coupon Released:</strong> Redemption for{" "}
                    <code className="rounded bg-white px-1 font-mono font-bold">
                      {impact.data.couponRedemptionCode}
                    </code>{" "}
                    will be removed.
                  </li>
                ) : null}
                <li>
                  • <strong>Linked Records:</strong> {impact.data.reviewsCount} review(s) and{" "}
                  {impact.data.notificationsCount} notification(s) will be preserved with order link cleared.
                </li>
                {impact.data.reportImpactWarning ? (
                  <li className="rounded-lg bg-amber-100/80 p-2 font-medium text-amber-950">
                    {impact.data.reportImpactWarning}
                  </li>
                ) : null}
              </ul>
            </div>

            {impact.data.inventoryHeld ? (
              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={reconcileStock}
                  onChange={(event) => setReconcileStock(event.target.checked)}
                  className="mt-0.5 size-4 rounded accent-[#0b3d39]"
                />
                <span>
                  <span className="block font-semibold text-slate-900">
                    Restore held stock &amp; add ledger reconciliation entry
                  </span>
                  <span className="block text-xs text-slate-500">
                    Recommended: adds offsetting positive stock adjustment rows so on-hand stock matches the immutable ledger 100%.
                  </span>
                </span>
              </label>
            ) : null}

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">
                Deletion Reason (Required for Audit Log)
              </span>
              <input
                value={orderReason}
                onChange={(event) => setOrderReason(event.target.value)}
                placeholder="e.g. Duplicate test order entered by mistake"
                className={adminFieldClass}
              />
            </label>
          </div>
        ) : impact?.kind === "badge" ? (
          <div className="space-y-4">
            <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950">
              <p className="font-bold">
                Linked to {impact.data.linkedProductsCount}{" "}
                {impact.data.linkedProductsCount === 1 ? "product" : "products"}
              </p>
              {impact.data.isSystem ? (
                <p className="font-semibold text-rose-700">
                  This is a built-in system badge and cannot be deleted.
                </p>
              ) : null}
              {impact.data.sampleProducts.length > 0 ? (
                <div>
                  <p className="text-[11px] font-medium text-amber-900">Affected products sample:</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4">
                    {impact.data.sampleProducts.map((p) => (
                      <li key={p.id}>{p.title}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-amber-900">No products currently carry this badge.</p>
              )}
            </div>

            {!impact.data.isSystem ? (
              <div className="space-y-2.5">
                {impact.data.availableMergeTargets.length > 0 ? (
                  <label
                    className={cn(
                      "block cursor-pointer rounded-xl border p-3.5 transition",
                      badgeMode === "merge"
                        ? "border-[#0b3d39] bg-teal-50/40 ring-1 ring-[#0b3d39]"
                        : "border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    <span className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="badge-delete-mode"
                        checked={badgeMode === "merge"}
                        onChange={() => setBadgeMode("merge")}
                        className="mt-0.5 accent-[#0b3d39]"
                      />
                      <span className="flex-1 text-xs">
                        <span className="block font-bold text-slate-900">
                          Merge into another badge (keeps products badged with zero loss)
                        </span>
                        <span className="mt-0.5 block text-slate-500">
                          All products with “{impact.data.badgeName}” will be reassigned to the selected badge atomically.
                        </span>
                      </span>
                    </span>
                    {badgeMode === "merge" ? (
                      <select
                        aria-label="Target badge"
                        value={targetBadgeId}
                        onChange={(event) => setTargetBadgeId(event.target.value)}
                        className={cn(adminFieldClass, "mt-2.5 h-9 text-xs")}
                      >
                        {impact.data.availableMergeTargets.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.slug})
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </label>
                ) : null}

                <label
                  className={cn(
                    "block cursor-pointer rounded-xl border p-3.5 transition",
                    badgeMode === "unlink"
                      ? "border-rose-500 bg-rose-50/40 ring-1 ring-rose-500"
                      : "border-slate-200 hover:bg-slate-50",
                  )}
                >
                  <span className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="badge-delete-mode"
                      checked={badgeMode === "unlink"}
                      onChange={() => setBadgeMode("unlink")}
                      className="mt-0.5 accent-rose-600"
                    />
                    <span className="text-xs">
                      <span className="block font-bold text-slate-900">
                        Remove badge from all products &amp; delete
                      </span>
                      <span className="mt-0.5 block text-slate-500">
                        Unlinks “{impact.data.badgeName}” from {impact.data.linkedProductsCount} product(s) and permanently deletes the badge.
                      </span>
                    </span>
                  </span>
                </label>
              </div>
            ) : null}
          </div>
        ) : impact?.kind === "supplier" ? (
          <div className="space-y-4">
            <div className="space-y-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950">
              <p className="font-bold uppercase tracking-wide text-amber-900">
                Linked Inventory &amp; Purchase History
              </p>
              <div className="grid grid-cols-3 gap-2 rounded-lg bg-white/90 p-2.5 text-center ring-1 ring-amber-200/70 tabular-nums">
                <div>
                  <span className="block text-[10px] uppercase text-slate-400">Purchases</span>
                  <span className="font-bold text-slate-950">{impact.data.purchasesCount}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-slate-400">Purchase Volume</span>
                  <span className="font-bold text-slate-950">
                    {formatReportMoney(impact.data.totalPurchaseAmount)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-slate-400">Linked Products</span>
                  <span className="font-bold text-slate-950">
                    {impact.data.linkedProductsCount}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {impact.data.availableMergeTargets.length > 0 ? (
                <label
                  className={cn(
                    "block cursor-pointer rounded-xl border p-3.5 transition",
                    supplierMode === "merge"
                      ? "border-[#0b3d39] bg-teal-50/40 ring-1 ring-[#0b3d39]"
                      : "border-slate-200 hover:bg-slate-50",
                  )}
                >
                  <span className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="supplier-delete-mode"
                      checked={supplierMode === "merge"}
                      onChange={() => setSupplierMode("merge")}
                      className="mt-0.5 accent-[#0b3d39]"
                    />
                    <span className="flex-1 text-xs">
                      <span className="block font-bold text-slate-900">
                        Merge all purchases &amp; products into another supplier
                      </span>
                      <span className="mt-0.5 block text-slate-500">
                        Keeps 100% of purchase history, COGS, and supplier profit reports intact under the target supplier.
                      </span>
                    </span>
                  </span>
                  {supplierMode === "merge" ? (
                    <select
                      aria-label="Target supplier"
                      value={targetSupplierId}
                      onChange={(event) => setTargetSupplierId(event.target.value)}
                      className={cn(adminFieldClass, "mt-2.5 h-9 text-xs")}
                    >
                      {impact.data.availableMergeTargets.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                          {s.phone ? ` (${s.phone})` : ""}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </label>
              ) : null}

              <label
                className={cn(
                  "block cursor-pointer rounded-xl border p-3.5 transition",
                  supplierMode === "archive"
                    ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500"
                    : "border-slate-200 hover:bg-slate-50",
                )}
              >
                <span className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="supplier-delete-mode"
                    checked={supplierMode === "archive"}
                    onChange={() => setSupplierMode("archive")}
                    className="mt-0.5 accent-amber-600"
                  />
                  <span className="text-xs">
                    <span className="block font-bold text-slate-900">Archive supplier</span>
                    <span className="mt-0.5 block text-slate-500">
                      Hides supplier from active pickers while keeping historical purchases intact.
                    </span>
                  </span>
                </span>
                {supplierMode === "archive" && impact.data.linkedProductsCount > 0 ? (
                  <label className="mt-2.5 flex items-center gap-2 pl-6 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={unlinkProducts}
                      onChange={(event) => setUnlinkProducts(event.target.checked)}
                      className="size-3.5 rounded accent-amber-600"
                    />
                    Unlink {impact.data.linkedProductsCount} currently assigned product(s)
                  </label>
                ) : null}
              </label>

              {impact.data.purchasesCount === 0 ? (
                <label
                  className={cn(
                    "block cursor-pointer rounded-xl border p-3.5 transition",
                    supplierMode === "hard_delete"
                      ? "border-rose-500 bg-rose-50/40 ring-1 ring-rose-500"
                      : "border-slate-200 hover:bg-slate-50",
                  )}
                >
                  <span className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="supplier-delete-mode"
                      checked={supplierMode === "hard_delete"}
                      onChange={() => setSupplierMode("hard_delete")}
                      className="mt-0.5 accent-rose-600"
                    />
                    <span className="text-xs">
                      <span className="block font-bold text-rose-700">Permanent delete</span>
                      <span className="mt-0.5 block text-slate-500">
                        Available because this supplier has 0 purchases. Removes the record permanently.
                      </span>
                    </span>
                  </span>
                </label>
              ) : null}
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">
                Audit Note (Optional)
              </span>
              <input
                value={supplierReason}
                onChange={(event) => setSupplierReason(event.target.value)}
                placeholder="e.g. Consolidated duplicate vendor account"
                className={adminFieldClass}
              />
            </label>
          </div>
        ) : null}

        {submitError ? (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800">
            {submitError}
          </p>
        ) : null}

        <DialogFooter className="mt-2 gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className={adminButtonClass.secondary}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void handleConfirm()}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MaterialIcon name="delete_forever" className="text-[18px]" />
            {submitting
              ? "Processing…"
              : impact?.kind === "badge" && badgeMode === "merge"
                ? "Merge & Delete Badge"
                : impact?.kind === "supplier" && supplierMode === "merge"
                  ? "Merge & Delete Supplier"
                  : impact?.kind === "supplier" && supplierMode === "archive"
                    ? "Archive Supplier"
                    : "Confirm Delete"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

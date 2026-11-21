"use client";

import { useEffect, useId, useMemo, useState, type FormEvent } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { formatReportMoney } from "@/lib/admin/reports";
import {
  fetchSuppliers,
  saveSupplier,
  type Supplier,
} from "@/lib/mart-api/inventory";
import { MartApiError } from "@/lib/mart-api/products";
import { fetchSuppliersReport } from "@/lib/mart-api/reports";
import { cn } from "@/lib/utils";

import {
  AdminEmpty,
  AdminLoading,
  AdminNotice,
  AdminPageHeader,
  adminButtonClass,
} from "../../_components/admin-ui";
import { useAdminNotify } from "../../_components/confirm-delete";
import { ImpactDeleteModal, type ImpactDeleteTarget } from "../../_components/impact-delete-modal";
import { useIsSuperadmin } from "../../_components/use-superadmin";
import { InventoryDialog } from "../_components/inventory-dialog";
import { InventorySubNav } from "../_components/inventory-nav";
import { InventoryPager } from "../_components/pager";
import { useInventoryWriter } from "../_components/use-inventory-role";

const PAGE_SIZE = 20;

type Draft = { name: string; phone: string; address: string; note: string };

const EMPTY: Draft = { name: "", phone: "", address: "", note: "" };

/** Generate consistent avatar initials based on supplier name */
function getSupplierInitials(name: string): string {
  if (!name.trim()) return "SP";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const BADGE_COLORS = [
  "bg-indigo-50 text-indigo-700 ring-indigo-200/60 border-indigo-100",
  "bg-blue-50 text-blue-700 ring-blue-200/60 border-blue-100",
  "bg-teal-50 text-teal-700 ring-teal-200/60 border-teal-100",
  "bg-emerald-50 text-emerald-700 ring-emerald-200/60 border-emerald-100",
  "bg-purple-50 text-purple-700 ring-purple-200/60 border-purple-100",
  "bg-rose-50 text-rose-700 ring-rose-200/60 border-rose-100",
  "bg-amber-50 text-amber-700 ring-amber-200/60 border-amber-100",
];

function getBadgeColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return BADGE_COLORS[Math.abs(hash) % BADGE_COLORS.length];
}

export default function SuppliersPage() {
  const canWrite = useInventoryWriter();
  const canDelete = useIsSuperadmin();
  const notify = useAdminNotify();

  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Supplier[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<{ id?: string; draft: Draft } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ImpactDeleteTarget | null>(null);
  const [reload, setReload] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [supplierStats, setSupplierStats] = useState<
    Record<string, { linkedProducts: number; purchases: number; spend: number }>
  >({});
  const [totalPurchaseSpend, setTotalPurchaseSpend] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchSuppliersReport({ preset: "this_year" })
      .then((report) => {
        if (cancelled) return;
        const next: Record<string, { linkedProducts: number; purchases: number; spend: number }> = {};
        for (const item of report.items) {
          next[item.supplierId] = {
            linkedProducts: item.linkedProductsCount,
            purchases: item.purchaseCount,
            spend: item.totalPurchaseSpend,
          };
        }
        setSupplierStats(next);
        setTotalPurchaseSpend(report.totalPurchaseSpend);
      })
      .catch(() => {
        /* report stats optional */
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setApplied(query.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    void fetchSuppliers({ q: applied, page, pageSize: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        setRows(result.items);
        setTotal(result.total);
        setPages(result.pages);
        setError("");
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setRows([]);
        setError(reason instanceof MartApiError ? reason.message : "Could not load suppliers.");
      })
      .finally(() => {
        if (!cancelled) {
          setIsRefreshing(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [applied, page, reload]);

  // Derived KPI metrics for the current view
  const metrics = useMemo(() => {
    const items = rows || [];
    const withPhone = items.filter((item) => Boolean(item.phone?.trim())).length;
    const totalLinked = Object.values(supplierStats).reduce((s, x) => s + x.linkedProducts, 0);
    return { withPhone, totalLinked, currentCount: items.length };
  }, [rows, supplierStats]);

  function handleDelete(supplier: Supplier) {
    setDeleteTarget({
      entity: "supplier",
      id: supplier.id,
      label: supplier.name,
    });
  }

  return (
    <div className="min-w-0 space-y-5">
      {/* Page Header */}
      <AdminPageHeader
        title="Suppliers"
        description="Manage vendors, procurement contacts, and distributor directory for stock purchases."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              className={adminButtonClass.secondary}
              onClick={() => {
                setIsRefreshing(true);
                setReload((v) => v + 1);
              }}
              title="Refresh suppliers list"
              disabled={isRefreshing}
            >
              <MaterialIcon
                name="refresh"
                className={cn("text-[18px]", isRefreshing && "animate-spin")}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            {canWrite ? (
              <button
                type="button"
                className={adminButtonClass.primary}
                onClick={() => setEditing({ draft: EMPTY })}
              >
                <MaterialIcon name="add" className="text-[18px]" />
                Add Supplier
              </button>
            ) : null}
          </div>
        }
      />

      <InventorySubNav />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total Suppliers
            </span>
            <span className="grid size-7 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
              <MaterialIcon name="business" className="text-[17px]" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {rows ? total : "—"}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">Active registered vendors</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              YTD Purchase Spend
            </span>
            <span className="grid size-7 place-items-center rounded-lg bg-teal-50 text-[#0b3d39]">
              <MaterialIcon name="payments" className="text-[17px]" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {totalPurchaseSpend != null ? formatReportMoney(totalPurchaseSpend) : "—"}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">This year procurement total</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Linked Products
            </span>
            <span className="grid size-7 place-items-center rounded-lg bg-sky-50 text-sky-600">
              <MaterialIcon name="inventory_2" className="text-[17px]" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {totalPurchaseSpend != null ? metrics.totalLinked : "—"}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">Assigned across vendors</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              With Contact Phone
            </span>
            <span className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <MaterialIcon name="call" className="text-[17px]" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {rows ? metrics.withPhone : "—"}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">On current page</p>
        </div>
      </div>

      {/* Main Content Section */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        {/* Search & Counter Toolbar */}
        <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:flex sm:items-center sm:justify-between sm:px-5">
          <div className="relative flex-1 sm:max-w-md">
            <MaterialIcon
              name="search"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[18px] text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by supplier name..."
              className="h-9.5 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-900 shadow-xs outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                title="Clear search"
              >
                <MaterialIcon name="close" className="text-[16px]" />
              </button>
            ) : null}
          </div>

          <div className="mt-2 flex items-center justify-between sm:mt-0 sm:justify-end sm:gap-3">
            <span className="text-xs font-medium text-slate-500">
              {rows ? (
                <>
                  Showing <strong className="text-slate-800">{rows.length}</strong> of{" "}
                  <strong className="text-slate-800">{total}</strong> {total === 1 ? "supplier" : "suppliers"}
                  {applied ? <span className="text-indigo-600"> for &ldquo;{applied}&rdquo;</span> : null}
                </>
              ) : (
                "Loading suppliers..."
              )}
            </span>
          </div>
        </div>

        {/* Loading State */}
        {rows == null ? <AdminLoading /> : null}

        {/* Error Notice */}
        {error ? (
          <div className="p-4 sm:p-5">
            <AdminNotice tone="warning">{error}</AdminNotice>
          </div>
        ) : null}

        {/* Empty State */}
        {rows && rows.length === 0 && !error ? (
          <div className="p-6 text-center">
            {applied ? (
              <div className="mx-auto max-w-sm space-y-3 py-6">
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400">
                  <MaterialIcon name="search_off" className="text-[24px]" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">No suppliers found</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    No supplier matching &ldquo;{applied}&rdquo; was found.
                  </p>
                </div>
                <button
                  type="button"
                  className={adminButtonClass.secondary}
                  onClick={() => setQuery("")}
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <AdminEmpty
                  title="No suppliers yet"
                  detail="Add a supplier to your directory so you can record inventory stock and track purchase orders."
                />
                {canWrite ? (
                  <button
                    type="button"
                    className={adminButtonClass.primary}
                    onClick={() => setEditing({ draft: EMPTY })}
                  >
                    <MaterialIcon name="add" className="text-[18px]" />
                    Add First Supplier
                  </button>
                ) : null}
              </div>
            )}
          </div>
        ) : null}

        {/* Suppliers Data List */}
        {rows && rows.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Suppliers Directory</caption>
                <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">
                      Supplier / Vendor
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Phone Number
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Address
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Notes / Terms
                    </th>
                    {canWrite ? (
                      <th scope="col" className="px-5 py-3.5 text-right">
                        Actions
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {rows.map((supplier) => {
                    const initials = getSupplierInitials(supplier.name);
                    const badgeColor = getBadgeColor(supplier.name);
                    return (
                      <tr
                        key={supplier.id}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        {/* Name & Badge */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "grid size-9 shrink-0 place-items-center rounded-xl font-bold text-xs shadow-2xs border ring-1",
                                badgeColor,
                              )}
                            >
                              {initials}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">
                                {supplier.name}
                              </p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                <span className="font-mono text-[11px] text-slate-400">
                                  ID: {supplier.id.slice(0, 8)}
                                </span>
                                {supplierStats[supplier.id] ? (
                                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-[#0b3d39] ring-1 ring-teal-200/70 tabular-nums">
                                    {supplierStats[supplier.id].linkedProducts} products ·{" "}
                                    {supplierStats[supplier.id].purchases} purchases
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="px-5 py-4">
                          {supplier.phone ? (
                            <a
                              href={`tel:${supplier.phone}`}
                              className="inline-flex items-center gap-1.5 font-medium text-slate-800 hover:text-indigo-600 transition-colors"
                              title={`Call ${supplier.phone}`}
                            >
                              <MaterialIcon
                                name="call"
                                className="text-[16px] text-emerald-600 shrink-0"
                              />
                              <span>{supplier.phone}</span>
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400 italic">
                              —
                            </span>
                          )}
                        </td>

                        {/* Address */}
                        <td className="px-5 py-4">
                          {supplier.address ? (
                            <div className="flex items-start gap-1.5 max-w-xs">
                              <MaterialIcon
                                name="location_on"
                                className="text-[16px] text-sky-600 shrink-0 mt-0.5"
                              />
                              <span
                                className="truncate text-xs leading-relaxed text-slate-700"
                                title={supplier.address}
                              >
                                {supplier.address}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">—</span>
                          )}
                        </td>

                        {/* Note */}
                        <td className="px-5 py-4">
                          {supplier.note ? (
                            <div
                              className="max-w-xs truncate text-xs text-slate-600"
                              title={supplier.note}
                            >
                              {supplier.note}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        {canWrite ? (
                          <td className="px-5 py-4 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                onClick={() =>
                                  setEditing({
                                    id: supplier.id,
                                    draft: {
                                      name: supplier.name,
                                      phone: supplier.phone,
                                      address: supplier.address,
                                      note: supplier.note,
                                    },
                                  })
                                }
                                title="Edit supplier details"
                              >
                                <MaterialIcon name="edit" className="text-[15px] text-slate-500" />
                                <span>Edit</span>
                              </button>

                              {canDelete ? (
                                <button
                                  type="button"
                                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-transparent px-2.5 text-xs font-semibold text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                                  onClick={() => handleDelete(supplier)}
                                  title="Delete or merge supplier (Admin only)"
                                >
                                  <MaterialIcon name="delete_outline" className="text-[16px]" />
                                  <span className="hidden lg:inline">Delete</span>
                                </button>
                              ) : null}
                            </div>
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="divide-y divide-slate-100 md:hidden">
              {rows.map((supplier) => {
                const initials = getSupplierInitials(supplier.name);
                const badgeColor = getBadgeColor(supplier.name);
                return (
                  <div key={supplier.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "grid size-9 shrink-0 place-items-center rounded-xl font-bold text-xs border ring-1",
                            badgeColor,
                          )}
                        >
                          {initials}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">
                            {supplier.name}
                          </p>
                          <span className="font-mono text-[10px] text-slate-400">
                            ID: {supplier.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>

                      {canWrite ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50"
                            onClick={() =>
                              setEditing({
                                id: supplier.id,
                                draft: {
                                  name: supplier.name,
                                  phone: supplier.phone,
                                  address: supplier.address,
                                  note: supplier.note,
                                },
                              })
                            }
                            title="Edit"
                          >
                            <MaterialIcon name="edit" className="text-[16px]" />
                          </button>
                          {canDelete ? (
                            <button
                              type="button"
                              className="grid size-8 place-items-center rounded-lg border border-transparent text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                              onClick={() => handleDelete(supplier)}
                              title="Delete or merge supplier (Admin only)"
                            >
                              <MaterialIcon name="delete_outline" className="text-[17px]" />
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pl-1">
                      {supplier.phone ? (
                        <div className="flex items-center gap-2">
                          <MaterialIcon name="call" className="text-[15px] text-emerald-600 shrink-0" />
                          <a
                            href={`tel:${supplier.phone}`}
                            className="font-medium text-slate-800 hover:text-indigo-600 underline-offset-2"
                          >
                            {supplier.phone}
                          </a>
                        </div>
                      ) : null}

                      {supplier.address ? (
                        <div className="flex items-start gap-2">
                          <MaterialIcon name="location_on" className="text-[15px] text-sky-600 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{supplier.address}</span>
                        </div>
                      ) : null}

                      {supplier.note ? (
                        <div className="mt-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 border border-slate-100 leading-relaxed">
                          <div className="flex items-center gap-1 font-semibold text-slate-700 mb-0.5">
                            <MaterialIcon name="notes" className="text-[14px]" />
                            <span>Notes:</span>
                          </div>
                          {supplier.note}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}

        {/* Pager */}
        {rows && total > PAGE_SIZE ? (
          <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-3">
            <InventoryPager
              page={page}
              pages={pages}
              total={total}
              pageSize={PAGE_SIZE}
              onPage={setPage}
            />
          </div>
        ) : null}
      </section>

      {/* Create / Edit Supplier Dialog */}
      {editing ? (
        <SupplierDialog
          id={editing.id}
          initial={editing.draft}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setReload((value) => value + 1);
            notify(message, "ok");
          }}
        />
      ) : null}

      <ImpactDeleteModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => setReload((value) => value + 1)}
      />
    </div>
  );
}

/** Redesigned, professional Supplier Dialog with clear placeholders and structured sections */
function SupplierDialog({
  id,
  initial,
  onClose,
  onSaved,
}: {
  id?: string;
  initial: Draft;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const titleId = useId();
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) {
      setNameError("Please enter the supplier / vendor name.");
      return;
    }
    setNameError("");
    setBusy(true);
    setError("");
    try {
      await saveSupplier(
        {
          name: draft.name.trim(),
          phone: draft.phone.trim(),
          address: draft.address.trim(),
          note: draft.note.trim(),
        },
        id,
      );
      onSaved(id ? "Supplier details updated successfully." : "New supplier added successfully.");
    } catch (reason) {
      setBusy(false);
      setError(reason instanceof MartApiError ? reason.message : "Could not save the supplier.");
    }
  }

  return (
    <InventoryDialog
      title={id ? "Edit Supplier" : "Add New Supplier"}
      titleId={titleId}
      description={
        id
          ? "Update the vendor contact details and procurement information."
          : "Add a new vendor or procurement partner to your supplier directory."
      }
      onClose={onClose}
    >
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        {/* Supplier Name */}
        <div>
          <label
            htmlFor="supplier-name"
            className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-800"
          >
            <MaterialIcon name="business" className="text-[16px] text-indigo-600" />
            <span>Supplier / Company Name</span>
            <span className="text-rose-500">*</span>
          </label>
          <input
            id="supplier-name"
            value={draft.name}
            onChange={(event) => {
              setDraft({ ...draft, name: event.target.value });
              if (nameError) setNameError("");
            }}
            placeholder="e.g. Vision Electronics Ltd. / Walton Hi-Tech Industries"
            autoFocus
            required
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? "supplier-name-error" : undefined}
            className={cn(
              "h-10 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 shadow-2xs outline-none transition placeholder:text-slate-400 focus:ring-2",
              nameError
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
                : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100",
            )}
          />
          {nameError ? (
            <p id="supplier-name-error" role="alert" className="mt-1 text-xs font-medium text-rose-600">
              {nameError}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-slate-400">
              Official legal name or commercial trading name of the supplier.
            </p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label
            htmlFor="supplier-phone"
            className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-800"
          >
            <MaterialIcon name="call" className="text-[16px] text-emerald-600" />
            <span>Contact Phone Number</span>
          </label>
          <input
            id="supplier-phone"
            value={draft.phone}
            onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
            placeholder="e.g. +880 1711-234567 or 01812-345678"
            autoComplete="tel"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-2xs outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Direct sales representative or accounts phone number.
          </p>
        </div>

        {/* Address */}
        <div>
          <label
            htmlFor="supplier-address"
            className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-800"
          >
            <MaterialIcon name="location_on" className="text-[16px] text-sky-600" />
            <span>Business / Warehouse Address</span>
          </label>
          <textarea
            id="supplier-address"
            value={draft.address}
            onChange={(event) => setDraft({ ...draft, address: event.target.value })}
            placeholder="e.g. House 14, Road 5, Motijheel Commercial Area, Dhaka - 1000"
            rows={2}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-2xs outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Physical dispatch warehouse or office billing address.
          </p>
        </div>

        {/* Note / Terms */}
        <div>
          <label
            htmlFor="supplier-note"
            className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-800"
          >
            <MaterialIcon name="notes" className="text-[16px] text-amber-600" />
            <span>Notes & Payment Terms</span>
          </label>
          <textarea
            id="supplier-note"
            value={draft.note}
            onChange={(event) => setDraft({ ...draft, note: event.target.value })}
            placeholder="e.g. Authorized distributor for kitchen appliances. Net 30 days credit limit. Contact: Mr. Rafiq (Accounts Manager)."
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-2xs outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Optional credit terms, representative contacts, or product specialties.
          </p>
        </div>

        {/* Error message */}
        {error ? (
          <div className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 ring-1 ring-rose-200/70">
            {error}
          </div>
        ) : null}

        {/* Modal Buttons */}
        <div className="flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className={adminButtonClass.secondary}
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={adminButtonClass.primary}
            disabled={busy}
          >
            {busy ? (
              <span className="flex items-center gap-2">
                <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                <span>Saving…</span>
              </span>
            ) : id ? (
              "Save Changes"
            ) : (
              "Create Supplier"
            )}
          </button>
        </div>
      </form>
    </InventoryDialog>
  );
}

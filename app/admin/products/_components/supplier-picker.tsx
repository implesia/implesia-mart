"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { fetchSuppliers, type Supplier } from "@/lib/mart-api/inventory";
import { cn } from "@/lib/utils";

import { adminFieldClass, FieldLabel } from "../../_components/admin-ui";

export function SupplierPicker({
  id,
  value,
  selectedName,
  onChange,
  error,
}: {
  id: string;
  value: string | null;
  selectedName?: string | null;
  onChange: (supplierId: string | null, supplierName: string | null) => void;
  error?: string;
}) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchSuppliers({ page: 1, pageSize: 100 })
      .then((page) => {
        if (!cancelled) setSuppliers(page.items);
      })
      .catch(() => {
        /* non-blocking: product can still be saved without supplier */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const activeSupplier = useMemo(
    () => suppliers.find((item) => item.id === value) ?? null,
    [suppliers, value],
  );
  const displayLabel = activeSupplier?.name ?? selectedName ?? "";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(
      (item) =>
        item.name.toLowerCase().includes(q) || item.phone.toLowerCase().includes(q),
    );
  }, [search, suppliers]);

  return (
    <div ref={containerRef} className="relative">
      <FieldLabel htmlFor={id}>Supplier (optional)</FieldLabel>
      <div className="flex items-center gap-2">
        <button
          id={id}
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className={cn(
            adminFieldClass,
            "flex items-center justify-between gap-2 text-left",
            error && "border-error focus-visible:border-error focus-visible:ring-error/30",
          )}
        >
          <span className={cn("truncate", !displayLabel && "text-neutral-400")}>
            {displayLabel || (loading ? "Loading suppliers…" : "No supplier selected")}
          </span>
          <MaterialIcon
            name={open ? "expand_less" : "expand_more"}
            className="shrink-0 text-[18px] text-neutral-400"
          />
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange(null, null);
              setOpen(false);
            }}
            className="inline-flex h-11 shrink-0 items-center gap-1 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900"
            title="Clear supplier"
          >
            <MaterialIcon name="close" className="text-[16px]" />
            Clear
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
          <div className="border-b border-neutral-100 p-2">
            <div className="relative">
              <MaterialIcon
                name="search"
                className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[18px] text-neutral-400"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search supplier by name or phone…"
                autoFocus
                className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50/60 pr-3 pl-9 text-sm text-neutral-900 outline-none focus:border-primary focus:bg-white"
              />
            </div>
          </div>

          <ul className="max-h-56 overflow-y-auto p-1 text-sm">
            <li>
              <button
                type="button"
                onClick={() => {
                  onChange(null, null);
                  setOpen(false);
                  setSearch("");
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-neutral-600 hover:bg-neutral-50",
                  !value && "bg-primary/5 font-semibold text-primary",
                )}
              >
                <span>No supplier</span>
                {!value ? <MaterialIcon name="check" className="text-[16px]" /> : null}
              </button>
            </li>
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-center text-xs text-neutral-400">
                {loading ? "Loading suppliers…" : "No matching suppliers found."}
              </li>
            ) : (
              filtered.map((supplier) => {
                const picked = supplier.id === value;
                return (
                  <li key={supplier.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(supplier.id, supplier.name);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition hover:bg-neutral-50",
                        picked && "bg-primary/5 font-semibold text-primary",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-neutral-900">{supplier.name}</span>
                        {supplier.phone ? (
                          <span className="block text-[11px] text-neutral-500">
                            {supplier.phone}
                          </span>
                        ) : null}
                      </span>
                      {picked ? <MaterialIcon name="check" className="text-[16px]" /> : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}

      <p className="mt-1.5 text-xs text-neutral-500">
        Admin only — links this product to a vendor for supplier performance &amp; purchase reports.
      </p>
    </div>
  );
}

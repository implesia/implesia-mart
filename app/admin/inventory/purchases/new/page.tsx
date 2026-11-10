"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  dhakaDateString,
  formatTakaAmount,
  grandTotal,
  issueFor,
  lineTotal,
  parsePositiveQuantity,
  parseUnitCost,
  validatePurchaseDraft,
} from "@/lib/admin/inventory";
import {
  fetchSuppliers,
  savePurchase,
  searchProductsForPurchase,
  type ProductChoice,
  type Supplier,
} from "@/lib/mart-api/inventory";
import { MartApiError } from "@/lib/mart-api/products";
import { cn } from "@/lib/utils";

import {
  AdminPageHeader,
  FieldLabel,
  adminButtonClass,
  adminFieldClass,
} from "../../../_components/admin-ui";
import { useAdminNotify } from "../../../_components/confirm-delete";
import { useInventoryWriter } from "../../_components/use-inventory-role";

type Line = {
  key: string;
  productId: string;
  variantId: string | null;
  productName: string;
  sku: string;
  quantity: string;
  unitCost: string;
};

function blankLine(): Line {
  return {
    key: Math.random().toString(36).slice(2),
    productId: "",
    variantId: null,
    productName: "",
    sku: "",
    quantity: "1",
    unitCost: "",
  };
}

export default function NewPurchasePage() {
  const router = useRouter();
  const notify = useAdminNotify();
  const canWrite = useInventoryWriter();
  const formId = useId();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [purchasedOn, setPurchasedOn] = useState(() => dhakaDateString(new Date()));
  const [invoiceNo, setInvoiceNo] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductChoice[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeResult, setActiveResult] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchSuppliers({ page: 1, pageSize: 100 })
      .then((page) => {
        if (!cancelled) setSuppliers(page.items);
      })
      .catch(() => {
        if (!cancelled) setSuppliers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const needle = query.trim();
    if (needle.length < 1) return;
    let cancelled = false;
    const handle = window.setTimeout(() => {
      setSearching(true);
      void searchProductsForPurchase(needle)
        .then((items) => {
          if (!cancelled) {
            setResults(items.filter((item) => item.id));
            setActiveResult(0);
          }
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [query]);

  const issues = submitted
    ? validatePurchaseDraft({
        supplierId,
        purchasedOn,
        invoiceNo,
        note,
        lines: lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          unitCost: line.unitCost,
        })),
      })
    : [];

  function addProduct(product: ProductChoice) {
    setLines((current) => {
      if (current.some((line) => line.productId === product.id && line.variantId === product.variantId)) return current;
      return [
        ...current,
        {
          ...blankLine(),
          productId: product.id,
          variantId: product.variantId,
          productName: product.name,
          sku: product.sku,
          unitCost: product.costPrice == null ? "" : String(product.costPrice),
        },
      ];
    });
    setQuery("");
    setResults([]);
  }

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  const totals = lines.map((line) => {
    const quantity = parsePositiveQuantity(line.quantity);
    const cost = parseUnitCost(line.unitCost);
    if (!quantity.ok || !cost.ok) return null;
    return lineTotal(quantity.value, cost.value);
  });
  const grand = grandTotal(
    lines.flatMap((line, index) => {
      const amount = totals[index];
      if (amount == null) return [];
      const quantity = parsePositiveQuantity(line.quantity);
      const cost = parseUnitCost(line.unitCost);
      if (!quantity.ok || !cost.ok) return [];
      return [{ quantity: quantity.value, unitCost: cost.value }];
    }),
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    const nextIssues = validatePurchaseDraft({
      supplierId,
      purchasedOn,
      invoiceNo,
      note,
      lines: lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        unitCost: line.unitCost,
      })),
    });
    if (nextIssues.length > 0) return;
    setBusy(true);
    setFormError("");
    try {
      await savePurchase({
        supplierId,
        purchasedOn,
        invoiceNo: invoiceNo.trim(),
        note: note.trim(),
        items: lines.flatMap((line) => {
          const quantity = parsePositiveQuantity(line.quantity);
          const cost = parseUnitCost(line.unitCost);
          if (!quantity.ok || !cost.ok) return [];
          return [
            {
              productId: line.productId,
              variantId: line.variantId,
              quantity: quantity.value,
              unitCost: cost.value,
            },
          ];
        }),
      });
      notify("Purchase saved. Cost price is updated on the server. Open the product to see it.", "ok");
      router.push("/admin/inventory/purchases");
    } catch (reason) {
      setBusy(false);
      setFormError(reason instanceof MartApiError ? reason.message : "Could not save the purchase.");
    }
  }

  if (!canWrite) {
    return (
      <AdminPageHeader
        title="New purchase"
        description="Your role can view purchases. Recording one needs an editor."
      />
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <AdminPageHeader
        title="New purchase"
        description="Search by product name or SKU. Line totals and the grand total update as you type. Dates are Asia/Dhaka."
        action={
          <Link href="/admin/inventory/purchases" className={adminButtonClass.secondary}>
            Back to purchases
          </Link>
        }
      />

      <form onSubmit={(event) => void submit(event)} className="space-y-4" noValidate>
        <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel htmlFor={`${formId}-supplier`}>Supplier</FieldLabel>
              <select
                id={`${formId}-supplier`}
                value={supplierId}
                onChange={(event) => setSupplierId(event.target.value)}
                aria-invalid={issueFor(issues, "supplierId") ? true : undefined}
                className={adminFieldClass}
              >
                <option value="">Choose a supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <FieldMessage id={`${formId}-supplier-error`} message={issueFor(issues, "supplierId")} />
            </div>
            <div>
              <FieldLabel htmlFor={`${formId}-date`}>Date</FieldLabel>
              <input
                id={`${formId}-date`}
                type="date"
                value={purchasedOn}
                onChange={(event) => setPurchasedOn(event.target.value)}
                aria-invalid={issueFor(issues, "purchasedOn") ? true : undefined}
                className={adminFieldClass}
              />
              <FieldMessage id={`${formId}-date-error`} message={issueFor(issues, "purchasedOn")} />
            </div>
            <div>
              <FieldLabel htmlFor={`${formId}-invoice`}>Invoice no (optional)</FieldLabel>
              <input
                id={`${formId}-invoice`}
                value={invoiceNo}
                onChange={(event) => setInvoiceNo(event.target.value)}
                aria-invalid={issueFor(issues, "invoiceNo") ? true : undefined}
                className={adminFieldClass}
              />
              <FieldMessage id={`${formId}-invoice-error`} message={issueFor(issues, "invoiceNo")} />
            </div>
          </div>
          <div className="mt-4">
            <FieldLabel htmlFor={`${formId}-note`}>Note (optional)</FieldLabel>
            <textarea
              id={`${formId}-note`}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              aria-invalid={issueFor(issues, "note") ? true : undefined}
              className={`${adminFieldClass} h-auto py-2.5`}
            />
            <FieldMessage id={`${formId}-note-error`} message={issueFor(issues, "note")} />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
          <FieldLabel htmlFor={`${formId}-search`}>Add a product</FieldLabel>
          <div className="relative">
            <MaterialIcon
              name="search"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-neutral-500"
            />
            <input
              id={`${formId}-search`}
              value={query}
              onChange={(event) => {
                const next = event.target.value;
                setQuery(next);
                if (!next.trim()) setResults([]);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveResult((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveResult((index) => Math.max(index - 1, 0));
                } else if (event.key === "Enter" && results[activeResult]) {
                  event.preventDefault();
                  addProduct(results[activeResult]);
                }
              }}
              placeholder="Search by name or SKU"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls={`${formId}-results`}
              aria-autocomplete="list"
              className={`${adminFieldClass} pl-10`}
            />
            {results.length > 0 ? (
              <ul
                id={`${formId}-results`}
                role="listbox"
                className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-xl bg-white py-1 shadow-lg ring-1 ring-neutral-200"
              >
                {results.map((product, index) => (
                  <li key={product.id} role="option" aria-selected={index === activeResult}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-primary",
                        index === activeResult ? "bg-primary/10" : "hover:bg-neutral-50",
                      )}
                      onMouseEnter={() => setActiveResult(index)}
                      onClick={() => addProduct(product)}
                    >
                      <span>
                        <span className="font-medium text-neutral-950">{product.name}</span>
                        <span className="mt-0.5 block text-xs text-neutral-500">{product.sku || "No SKU"}</span>
                      </span>
                      <span className="text-xs text-neutral-500">
                        {product.quantity == null ? "Made to order" : `${product.quantity} in stock`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {searching ? <p className="mt-2 text-xs text-neutral-500">Searching…</p> : null}
          <FieldMessage id={`${formId}-lines-error`} message={issueFor(issues, "lines")} />

          {lines.length === 0 ? (
            <p className="mt-4 rounded-xl bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-600">
              No lines yet. Search for a product to add one.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {lines.map((line, index) => {
                const amount = totals[index];
                const quantityError = issueFor(issues, `lines.${index}.quantity`);
                const costError = issueFor(issues, `lines.${index}.unitCost`);
                return (
                  <div key={line.key} className="rounded-xl ring-1 ring-neutral-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-neutral-950">{line.productName}</p>
                        <p className="text-xs text-neutral-500">{line.sku || "No SKU"}</p>
                      </div>
                      <button
                        type="button"
                        className={adminButtonClass.quiet}
                        onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div>
                        <FieldLabel htmlFor={`${formId}-qty-${line.key}`}>Quantity</FieldLabel>
                        <input
                          id={`${formId}-qty-${line.key}`}
                          inputMode="numeric"
                          value={line.quantity}
                          onChange={(event) => updateLine(line.key, { quantity: event.target.value })}
                          aria-invalid={quantityError ? true : undefined}
                          className={adminFieldClass}
                        />
                        <FieldMessage id={`${formId}-qty-${line.key}-error`} message={quantityError} />
                      </div>
                      <div>
                        <FieldLabel htmlFor={`${formId}-cost-${line.key}`}>Unit cost</FieldLabel>
                        <input
                          id={`${formId}-cost-${line.key}`}
                          inputMode="decimal"
                          value={line.unitCost}
                          onChange={(event) => updateLine(line.key, { unitCost: event.target.value })}
                          aria-invalid={costError ? true : undefined}
                          className={adminFieldClass}
                        />
                        <FieldMessage id={`${formId}-cost-${line.key}-error`} message={costError} />
                      </div>
                      <div>
                        <p className="mb-1.5 text-sm font-medium text-neutral-700">Line total</p>
                        <p className="flex h-11 items-center text-sm font-semibold tabular-nums text-neutral-950" aria-live="polite">
                          {amount == null ? "—" : formatTakaAmount(amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
            <p className="text-sm text-neutral-600">Grand total</p>
            <p className="text-lg font-semibold tabular-nums text-neutral-950" aria-live="polite">
              {formatTakaAmount(grand)}
            </p>
          </div>
        </section>

        {formError ? (
          <p role="alert" className="text-sm text-error">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link href="/admin/inventory/purchases" className={adminButtonClass.secondary}>
            Cancel
          </Link>
          <button type="submit" className={adminButtonClass.primary} disabled={busy}>
            {busy ? "Saving…" : "Save purchase"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FieldMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs text-error">
      {message}
    </p>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  addCartItem,
  listCarts,
  type CartDirectory,
  type SavedCart,
} from "@/lib/mart-api/cart";
import { listMartProducts, MartApiError } from "@/lib/mart-api/products";
import {
  formatTaka,
  readSession,
  type AdminProduct,
} from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import {
  AdminEmpty,
  AdminPageHeader,
  adminButtonClass,
} from "../_components/admin-ui";

function deliveryOffer(cart: SavedCart) {
  const fees = [
    cart.insideEnabled ? cart.insideDhaka : null,
    cart.suburbanEnabled ? cart.dhakaSuburban : null,
    cart.outsideEnabled ? cart.outsideDhaka : null,
  ].filter((fee): fee is number => fee != null);
  if (fees.length === 0) return "Off";
  if (fees.every((fee) => fee === fees[0])) return formatTaka(cart.shipping);
  return [
    cart.insideEnabled ? `City ${formatTaka(cart.insideDhaka)}` : null,
    cart.suburbanEnabled ? `Suburban ${formatTaka(cart.dhakaSuburban)}` : null,
    cart.outsideEnabled ? `Other ${formatTaka(cart.outsideDhaka)}` : null,
  ]
    .filter((part) => part != null)
    .join(" · ");
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "user", label: "Registered Users" },
  { id: "guest", label: "Guests / Abandoned" },
] as const;

type OwnerFilter = (typeof FILTERS)[number]["id"];

export default function AdminCartPage() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [owner, setOwner] = useState<OwnerFilter>("all");
  const [page, setPage] = useState(1);
  const [directory, setDirectory] = useState<CartDirectory | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  
  const [lastLoadedKey, setLastLoadedKey] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(query.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const currentKey = JSON.stringify({ q: debounced, owner, page, reloadKey });
  const isLoading = currentKey !== lastLoadedKey;

  useEffect(() => {
    let cancelled = false;
    listCarts({ q: debounced, owner, page })
      .then((result) => {
        if (cancelled) return;
        setDirectory(result);
        setError("");
        setSelectedId((current) => {
          if (current && result.items.some((cart) => cart.id === current))
            return current;
          return result.items[0]?.id ?? null;
        });
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(
            reason instanceof MartApiError
              ? reason.message
              : "Could not load carts.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLastLoadedKey(currentKey);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, owner, page, reloadKey, currentKey]);

  const selected =
    directory?.items.find((cart) => cart.id === selectedId) ?? null;
  const metrics = directory?.metrics;
  const potentialCartValue = directory
    ? directory.items.reduce((sum, cart) => sum + cart.subtotal, 0)
    : undefined;

  return (
    <div className="min-w-0 space-y-4 pb-8">
      <AdminPageHeader
        title="Carts"
        description="Logged-in shoppers and anonymous visitors can both add products. This page shows who added which product, and how many."
      />
      
      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 shadow-sm">
          <MaterialIcon name="error" className="text-[16px] text-red-500" />
          {error}
        </div>
      ) : null}

      {/* Summary Cards - Executive KPI Strip */}
      <section
        aria-label="Cart summary"
        className="grid grid-cols-2 gap-2.5 xl:grid-cols-4"
      >
        <Metric
          label="Total Active Carts"
          value={metrics?.carts}
          hint={metrics?.units != null ? `${metrics.units} total units` : undefined}
          icon="shopping_cart"
          tone="primary"
        />
        <Metric
          label="Registered User Carts"
          value={metrics?.userCarts}
          hint="Signed-in shoppers"
          icon="person"
          tone="emerald"
        />
        <Metric
          label="Guest / Abandoned Carts"
          value={metrics?.guestCarts}
          hint="Anonymous visitors"
          icon="visibility_off"
          tone="amber"
        />
        <Metric
          label="Potential Cart Value"
          value={potentialCartValue != null ? formatTaka(potentialCartValue) : undefined}
          hint="Merchandise value on page"
          icon="payments"
          tone="neutral"
        />
      </section>

      {/* Main Split Layout */}
      <div className="grid items-start gap-3.5 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        
        {/* Left Side: Cart List */}
        <section className="min-w-0 flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-neutral-200/80">
          {/* Header & Filters */}
          <div className="flex flex-col gap-2.5 border-b border-neutral-100 bg-white px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block flex-1">
              <MaterialIcon
                name="search"
                className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[18px] text-neutral-400"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, email, or product..."
                aria-label="Search carts"
                className="h-8 w-full rounded-md border-0 bg-neutral-100 pr-2 pl-8 text-[13px] outline-none transition-colors placeholder:text-neutral-500 focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <div className="flex shrink-0 rounded-md bg-neutral-100 p-0.5">
              {FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => {
                    setOwner(filter.id);
                    setPage(1);
                  }}
                  className={cn(
                    "h-7 rounded px-2.5 text-[11px] font-semibold transition-all",
                    owner === filter.id
                      ? "bg-white text-neutral-950 shadow-sm ring-1 ring-black/5"
                      : "text-neutral-500 hover:text-neutral-800",
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* List Body */}
          <div className="flex-1">
            {isLoading && !directory ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-neutral-100/80" />
                ))}
              </div>
            ) : error && !directory ? null : !directory || directory.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <MaterialIcon name="shopping_cart" className="mb-2 text-[28px] text-neutral-300" />
                <h3 className="text-sm font-medium text-neutral-800">No carts yet</h3>
                <p className="mt-0.5 text-xs text-neutral-500">A cart appears here after a product is added.</p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {directory.items.map((cart) => {
                  const isSelected = selectedId === cart.id;
                  return (
                    <li key={cart.id} className="relative">
                      {isSelected && <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" />}
                      <button
                        type="button"
                        onClick={() => setSelectedId(cart.id)}
                        className={cn(
                          "flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors",
                          isSelected ? "bg-primary/[0.04]" : "hover:bg-neutral-50",
                        )}
                      >
                        <OwnerBadge kind={cart.owner.kind} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={cn("truncate text-[13px] font-semibold", isSelected ? "text-primary" : "text-neutral-950")}>
                              {ownerLabel(cart)}
                            </span>
                            <span className="shrink-0 text-[13px] font-bold tabular-nums text-neutral-950">
                              {formatTaka(cart.total)}
                            </span>
                          </div>
                          <span className="mt-0.5 block truncate text-[11px] text-neutral-500">
                            {cart.items.map((item) => `${item.title} × ${item.quantity}`).join(", ")}
                          </span>
                          <span className="mt-1 block text-[10px] font-medium text-neutral-400">
                            {when(cart.updatedAt)}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Pagination */}
          {directory && directory.pages > 1 ? (
            <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/50 px-3 py-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="inline-flex h-7 items-center rounded px-2 text-[11px] font-medium text-neutral-600 transition-colors hover:bg-white hover:shadow-sm disabled:opacity-40"
              >
                <MaterialIcon name="chevron_left" className="text-[14px]" />
                Prev
              </button>
              <span className="text-[11px] font-medium text-neutral-500">Page {page} of {directory.pages}</span>
              <button
                type="button"
                disabled={page >= directory.pages}
                onClick={() => setPage((current) => current + 1)}
                className="inline-flex h-7 items-center rounded px-2 text-[11px] font-medium text-neutral-600 transition-colors hover:bg-white hover:shadow-sm disabled:opacity-40"
              >
                Next
                <MaterialIcon name="chevron_right" className="text-[14px]" />
              </button>
            </div>
          ) : null}
        </section>

        {/* Right Side: Detail & Add Panel */}
        <div className="space-y-3.5">
          <CartDetail cart={selected} />
          <AddPanel onAdded={() => setReloadKey((current) => current + 1)} />
        </div>
      </div>
    </div>
  );
}

function CartDetail({ cart }: { cart: SavedCart | null }) {
  return (
    <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-neutral-200/80">
      <div className="border-b border-neutral-100 bg-neutral-50/50 px-3.5 py-3">
        <h2 className="text-[13px] font-semibold text-neutral-950">Cart detail</h2>
        {cart ? (
          <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-neutral-500">
            <span className="font-semibold text-neutral-700">{ownerLabel(cart)}</span>
            {cart.owner.email && <><span className="text-neutral-300">•</span>{cart.owner.email}</>}
            {cart.owner.role && <><span className="text-neutral-300">•</span><span className="capitalize">{cart.owner.role}</span></>}
          </p>
        ) : (
          <p className="mt-0.5 text-[11px] text-neutral-500">Select a cart to see its products.</p>
        )}
      </div>
      
      {!cart ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <MaterialIcon name="receipt_long" className="mb-2 text-[28px] text-neutral-300" />
          <h3 className="text-sm font-medium text-neutral-800">Nothing selected</h3>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-neutral-100 px-3.5">
            {cart.items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 py-3">
                <Thumb src={item.imageSrc} />
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-neutral-950">{item.title}</span>
                  <span className="mt-0.5 block text-[11px] text-neutral-500">
                    {item.available ? formatTaka(item.unitPrice) : "Unavailable"}
                  </span>
                  <span className="mt-1 inline-flex rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-700">
                    Qty {item.quantity}
                  </span>
                </div>
                <span className="text-[13px] font-bold tabular-nums text-neutral-950">
                  {item.available ? formatTaka(item.lineTotal) : "—"}
                </span>
              </li>
            ))}
          </ul>
          
          {/* Summary */}
          <dl className="space-y-2 border-t border-dashed border-neutral-200 bg-neutral-50/50 px-3.5 py-3 text-[12px]">
            <div className="flex justify-between text-neutral-600">
              <dt>Subtotal</dt>
              <dd className="font-medium tabular-nums text-neutral-900">{formatTaka(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-neutral-600">
              <dt>Delivery</dt>
              <dd className="font-medium text-neutral-900">{deliveryOffer(cart)}</dd>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-2 text-[13px] font-bold text-neutral-950">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatTaka(cart.total)}</dd>
            </div>
          </dl>
        </>
      )}
    </section>
  );
}

function AddPanel({ onAdded }: { onAdded: () => void }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [pending, setPending] = useState("");
  const [message, setMessage] = useState("");
  const email = readSession()?.email;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    listMartProducts({ q: debounced, visibility: "live", status: "available", page: 1, pageSize: 5 })
      .then((result) => { if (!cancelled) setProducts(result.items); })
      .catch(() => { if (!cancelled) setProducts([]); });
    return () => { cancelled = true; };
  }, [debounced]);

  return (
    <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-neutral-200/80">
      <div className="border-b border-neutral-100 bg-neutral-50/50 px-3.5 py-3">
        <h2 className="text-[13px] font-semibold text-neutral-950">
          Add as <span className="text-primary">{email ?? "you"}</span>
        </h2>
        <label className="relative mt-2 block">
          <MaterialIcon name="search" className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[18px] text-neutral-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search live products..."
            className="h-8 w-full rounded-md border-0 bg-white pr-2 pl-8 text-[13px] shadow-sm outline-none ring-1 ring-neutral-200 transition-colors placeholder:text-neutral-400 focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </div>

      {message ? (
        <div className="flex items-center gap-1.5 border-b border-red-100 bg-red-50 px-3.5 py-1.5 text-[11px] font-medium text-red-700">
          <MaterialIcon name="error" className="text-[14px]" />
          {message}
        </div>
      ) : null}

      <ul className="divide-y divide-neutral-100">
        {products.length === 0 && debounced ? (
          <li className="px-3.5 py-5 text-center text-[12px] text-neutral-500">No products found.</li>
        ) : (
          products.map((product) => (
            <li key={product.id} className="flex items-center gap-2.5 px-3.5 py-2 transition-colors hover:bg-neutral-50">
              <Thumb src={product.imageSrc} />
              <div className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-neutral-950">{product.title}</span>
                <span className="block text-[11px] text-neutral-500 tabular-nums">{formatTaka(product.price)}</span>
              </div>
              <button
                type="button"
                disabled={!product.id || pending === product.id}
                onClick={() => {
                  if (!product.id) return;
                  const id = product.id;
                  setPending(id);
                  setMessage("");
                  addCartItem(id, 1)
                    .then(() => onAdded())
                    .catch((reason) => setMessage(reason instanceof MartApiError ? reason.message : "Could not update cart."))
                    .finally(() => setPending(""));
                }}
                className={cn(
                  "inline-flex h-7 shrink-0 items-center justify-center rounded-md px-2.5 text-[11px] font-semibold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  pending === product.id
                    ? "bg-neutral-100 text-neutral-400"
                    : "bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95"
                )}
              >
                {pending === product.id ? (
                  <span className="size-3 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-500" />
                ) : (
                  "Add"
                )}
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function Metric({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: number | string | undefined;
  hint?: string;
  icon: string;
  tone?: "neutral" | "primary" | "emerald" | "amber";
}) {
  const toneStyles = {
    neutral: "bg-neutral-100 text-neutral-600",
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="flex items-center justify-between rounded-xl bg-white px-3.5 py-3 shadow-sm ring-1 ring-neutral-200/80 transition-all hover:shadow-md">
      <div>
        <p className="text-[11px] font-medium text-neutral-500">{label}</p>
        <p className="mt-0.5 text-xl font-bold tracking-tight tabular-nums text-neutral-950">
          {value ?? "—"}
        </p>
        {hint ? <p className="mt-0.5 text-[10px] text-neutral-400">{hint}</p> : null}
      </div>
      <div className={cn("grid size-8 shrink-0 place-items-center rounded-lg", toneStyles[tone])}>
        <MaterialIcon name={icon} className="text-[18px]" />
      </div>
    </div>
  );
}

function OwnerBadge({ kind }: { kind: "user" | "guest" }) {
  const guest = kind === "guest";
  return (
    <span
      className={cn(
        "mt-0.5 inline-flex shrink-0 items-center rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1",
        guest 
          ? "bg-amber-50 text-amber-700 ring-amber-200" 
          : "bg-emerald-50 text-emerald-700 ring-emerald-200",
      )}
    >
      {guest ? "Guest" : "User"}
    </span>
  );
}

function ownerLabel(cart: SavedCart) {
  if (cart.owner.kind === "guest") return "Anonymous shopper";
  return cart.owner.fullName || cart.owner.email || "Logged-in shopper";
}

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function Thumb({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-neutral-100 text-neutral-400 ring-1 ring-neutral-200/60">
        <MaterialIcon name="image" className="text-[16px]" />
      </span>
    );
  }
  return (
    <span className="relative size-9 shrink-0 overflow-hidden rounded-md bg-neutral-100 ring-1 ring-neutral-200/60">
      <Image src={src} alt="" fill sizes="36px" className="object-cover" onError={() => setFailed(true)} />
    </span>
  );
}
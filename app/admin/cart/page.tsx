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
import { formatTaka, readSession, type AdminProduct } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import {
  AdminEmpty,
  AdminPageHeader,
  adminButtonClass,
} from "../_components/admin-ui";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "user", label: "Logged in" },
  { id: "guest", label: "Anonymous" },
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
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(query.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    listCarts({ q: debounced, owner, page })
      .then((result) => {
        if (cancelled) return;
        setDirectory(result);
        setError("");
        setSelectedId((current) => {
          if (current && result.items.some((cart) => cart.id === current)) return current;
          return result.items[0]?.id ?? null;
        });
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(reason instanceof MartApiError ? reason.message : "Could not load carts.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, owner, page, reloadKey]);

  const selected = directory?.items.find((cart) => cart.id === selectedId) ?? null;
  const metrics = directory?.metrics;

  return (
    <div className="min-w-0 space-y-4">
      <AdminPageHeader
        title="Carts"
        description="Logged-in shoppers and anonymous visitors can both add products. This page shows who added which product, and how many."
      />
      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      <section aria-label="Cart summary" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Carts with items" value={metrics?.carts} />
        <Metric label="Logged in" value={metrics?.userCarts} />
        <Metric label="Anonymous" value={metrics?.guestCarts} />
        <Metric label="Units added" value={metrics?.units} />
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        <section className="min-w-0 overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
          <div className="space-y-3 border-b border-neutral-100 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-neutral-950">Shopper carts</h2>
              <div className="flex rounded-full bg-admin-subtle p-1">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => {
                      setOwner(filter.id);
                      setPage(1);
                    }}
                    className={cn(
                      "h-8 rounded-full px-3 text-xs font-medium",
                      owner === filter.id
                        ? "bg-white text-neutral-950 shadow-sm"
                        : "text-neutral-500",
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="relative block">
              <MaterialIcon
                name="search"
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-neutral-400"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, email, or product"
                aria-label="Search carts"
                className="h-10 w-full rounded-xl border border-neutral-200 bg-admin-subtle pr-3 pl-10 text-sm outline-none placeholder:text-neutral-400 focus:border-primary focus:ring-3 focus:ring-primary/25"
              />
            </label>
          </div>
          {loading && !directory ? (
            <div className="h-48 animate-pulse bg-neutral-50" />
          ) : error && !directory ? null : !directory || directory.items.length === 0 ? (
            <AdminEmpty
              title="No carts yet."
              detail="A cart appears here after a logged-in shopper or an anonymous visitor adds a product."
            />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {directory.items.map((cart) => (
                <li key={cart.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(cart.id)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left sm:px-5",
                      selectedId === cart.id ? "bg-primary/5" : "hover:bg-neutral-50",
                    )}
                  >
                    <OwnerBadge kind={cart.owner.kind} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-neutral-950">
                        {ownerLabel(cart)}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-neutral-500">
                        {cart.items.map((item) => `${item.title} × ${item.quantity}`).join(", ")}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-semibold tabular-nums text-neutral-950">
                        {formatTaka(cart.total)}
                      </span>
                      <span className="block text-xs text-neutral-500">{when(cart.updatedAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {directory && directory.pages > 1 ? (
            <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 text-sm sm:px-5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="font-medium text-neutral-600 disabled:text-neutral-300"
              >
                Previous
              </button>
              <span className="text-neutral-500">
                {page} / {directory.pages}
              </span>
              <button
                type="button"
                disabled={page >= directory.pages}
                onClick={() => setPage((current) => current + 1)}
                className="font-medium text-neutral-600 disabled:text-neutral-300"
              >
                Next
              </button>
            </div>
          ) : null}
        </section>

        <div className="space-y-4">
          <CartDetail cart={selected} />
          <AddPanel
            onAdded={() => {
              setLoading(false);
              setReloadKey((current) => current + 1);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function CartDetail({ cart }: { cart: SavedCart | null }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
      <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
        <h2 className="text-sm font-semibold text-neutral-950">Cart detail</h2>
        {cart ? (
          <p className="mt-1 text-xs text-neutral-500">
            {ownerLabel(cart)}
            {cart.owner.email ? ` · ${cart.owner.email}` : " · no account"}
            {cart.owner.role ? ` · ${cart.owner.role}` : ""}
          </p>
        ) : (
          <p className="mt-1 text-xs text-neutral-500">Select a cart to see its products.</p>
        )}
      </div>
      {!cart ? (
        <AdminEmpty title="Nothing selected." detail="Choose a cart from the list." />
      ) : (
        <>
          <ul className="divide-y divide-neutral-100">
            {cart.items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                <Thumb src={item.imageSrc} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-neutral-950">
                    {item.title}
                  </span>
                  <span className="block text-xs text-neutral-500">
                    {item.available
                      ? `${formatTaka(item.unitPrice)} each`
                      : "No longer available"}
                    {item.addedAt ? ` · added ${when(item.addedAt)}` : ""}
                  </span>
                  <span className="mt-1 block text-xs font-medium text-neutral-800">
                    Quantity {item.quantity}
                  </span>
                </span>
                <span className="text-sm font-semibold tabular-nums text-neutral-950">
                  {item.available ? formatTaka(item.lineTotal) : "—"}
                </span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-neutral-100 px-4 py-4 text-sm sm:px-5">
            <Row label="Subtotal" value={formatTaka(cart.subtotal)} />
            <Row label="Delivery" value={formatTaka(cart.shipping)} />
            <div className="flex items-center justify-between pt-1 text-base font-semibold text-neutral-950">
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
    listMartProducts({
      q: debounced,
      visibility: "live",
      status: "available",
      page: 1,
      pageSize: 5,
    })
      .then((result) => {
        if (!cancelled) setProducts(result.items);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
      <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
        <h2 className="text-sm font-semibold text-neutral-950">Add as {email ?? "you"}</h2>
        <p className="mt-1 text-xs text-neutral-500">
          This adds to the signed-in account. A visitor who is not signed in gets their own cart.
        </p>
        <label className="relative mt-3 block">
          <MaterialIcon
            name="search"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-neutral-400"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search live products"
            aria-label="Search live products"
            className="h-10 w-full rounded-xl border border-neutral-200 bg-admin-subtle pr-3 pl-10 text-sm outline-none placeholder:text-neutral-400 focus:border-primary focus:ring-3 focus:ring-primary/25"
          />
        </label>
      </div>
      {message ? <p className="px-4 py-2 text-sm text-red-700 sm:px-5">{message}</p> : null}
      <ul className="divide-y divide-neutral-100">
        {products.map((product) => (
          <li key={product.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <Thumb src={product.imageSrc} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-neutral-950">
                {product.title}
              </span>
              <span className="block text-xs text-neutral-500">{formatTaka(product.price)}</span>
            </span>
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
                  .catch((reason) => {
                    setMessage(
                      reason instanceof MartApiError
                        ? reason.message
                        : "The cart could not be updated.",
                    );
                  })
                  .finally(() => setPending(""));
              }}
              className={adminButtonClass.primary}
            >
              Add
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-neutral-200/90">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-neutral-950">
        {value ?? "—"}
      </p>
    </div>
  );
}

function OwnerBadge({ kind }: { kind: "user" | "guest" }) {
  const guest = kind === "guest";
  return (
    <span
      className={cn(
        "mt-0.5 inline-flex shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold",
        guest ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-800",
      )}
    >
      {guest ? "Anonymous" : "Logged in"}
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
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-neutral-600">
      <dt>{label}</dt>
      <dd className="tabular-nums text-neutral-950">{value}</dd>
    </div>
  );
}

function Thumb({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-400">
        <MaterialIcon name="image" className="text-[20px]" />
      </span>
    );
  }
  return (
    <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
      <Image
        src={src}
        alt=""
        fill
        sizes="48px"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

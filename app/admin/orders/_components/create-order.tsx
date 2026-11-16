"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  OFFLINE_PAYMENT_METHODS,
  PAYMENT_METHOD_LABEL,
  dhakaToday,
  newIdempotencyKey,
  offlineFieldErrors,
  offlineMoneyPreview,
  stockBlockMessage,
  type OfflinePaymentMethod,
} from "@/lib/admin/orders-desk";
import { createOfflineOrder, searchOrderCustomers, type CustomerMatch } from "@/lib/mart-api/orders-desk";
import { quoteOrder } from "@/lib/mart-api/orders";
import { MartApiError } from "@/lib/mart-api/products";
import { formatTaka } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import { AdminPageHeader, FieldError, adminButtonClass, adminFieldClass } from "../../_components/admin-ui";
import { ProductPicker } from "./product-picker";

type Line = {
  key: string;
  productId: string;
  variantId: string | null;
  title: string;
  optionLabel: string;
  imageSrc: string;
  quantity: string;
  unitPrice: string;
  priceEdited: boolean;
  stock: number | null;
};

const inputClass = adminFieldClass;

export function CreateOrder() {
  const router = useRouter();
  const idempotencyKey = useRef(newIdempotencyKey());
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerHits, setCustomerHits] = useState<{ term: string; matches: CustomerMatch[] }>({ term: "", matches: [] });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [discount, setDiscount] = useState("0");
  const [delivery, setDelivery] = useState("");
  const [method, setMethod] = useState<OfflinePaymentMethod>("cash");
  const [paid, setPaid] = useState("0");
  const [reference, setReference] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [quoteState, setQuoteState] = useState<{ key: string; quote: { subtotal: number; shipping: number } | null }>({
    key: "",
    quote: null,
  });
  const customerTerm = customerQuery.trim();
  const matches = customerHits.term === customerTerm && customerTerm.length >= 2 ? customerHits.matches : [];

  useEffect(() => {
    if (customerTerm.length < 2) return;
    let cancelled = false;
    const handle = window.setTimeout(() => {
      void searchOrderCustomers(customerTerm)
        .then((items) => {
          if (!cancelled) setCustomerHits({ term: customerTerm, matches: items });
        })
        .catch(() => {
          if (!cancelled) setCustomerHits({ term: customerTerm, matches: [] });
        });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [customerTerm]);

  const catalogLines = lines.length > 0 && lines.every((line) => !line.priceEdited);
  const quoteKey =
    catalogLines && district.trim().length >= 2
      ? JSON.stringify({
          district: district.trim(),
          area: area.trim(),
          lines: lines.map((line) => [line.productId, line.variantId, line.quantity]),
        })
      : "";
  useEffect(() => {
    if (!quoteKey) return;
    let cancelled = false;
    const handle = window.setTimeout(() => {
      void quoteOrder({
        source: "direct",
        district,
        area,
        items: lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          quantity: Math.max(1, Number(line.quantity) || 1),
        })),
      })
        .then((next) => {
          if (cancelled) return;
          setQuoteState({
            key: quoteKey,
            quote: next.mocked ? null : { subtotal: next.subtotal, shipping: next.shipping },
          });
        })
        .catch(() => {
          if (!cancelled) setQuoteState({ key: quoteKey, quote: null });
        });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [quoteKey, district, area, lines]);
  const quote = quoteState.key === quoteKey ? quoteState.quote : null;

  const preview = offlineMoneyPreview({
    lines: lines.map((line) => ({
      quantity: Math.max(0, Number(line.quantity) || 0),
      unitPrice: Math.max(0, Number(line.unitPrice) || 0),
      priceEdited: line.priceEdited,
    })),
    manualDiscount: Number(discount) || 0,
    deliveryCharge: delivery.trim() ? Number(delivery) || 0 : 0,
    quote,
  });

  function fillCustomer(match: CustomerMatch) {
    setName(match.customerName);
    setPhone(match.phone);
    setEmail(match.email);
    setDistrict(match.district);
    setArea(match.area);
    setAddress(match.address);
    setCustomerQuery("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const draft = {
      customerName: name,
      phone,
      email,
      district,
      area,
      address,
      items: lines.map((line) => ({ quantity: Number(line.quantity) })),
      manualDiscount: discount,
      deliveryCharge: delivery,
      paymentMethod: method,
      paidAmount: paid,
      paymentReference: reference,
      orderDate,
    };
    const nextErrors = offlineFieldErrors(draft, dhakaToday());
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setPending(true);
    setFormError(null);
    try {
      const saved = await createOfflineOrder(
        {
          customerName: name,
          phone,
          email,
          district,
          area,
          address,
          notes,
          items: lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            quantity: Number(line.quantity),
            unitPrice: Number(line.unitPrice),
            priceEdited: line.priceEdited,
          })),
          manualDiscount: Number(discount) || 0,
          deliveryCharge: delivery.trim() ? Number(delivery) : 0,
          paymentMethod: method,
          paidAmount: Number(paid) || 0,
          paymentReference: reference,
          orderDate: orderDate || null,
        },
        idempotencyKey.current,
      );
      router.push(`/admin/orders/${saved.id}`);
    } catch (reason) {
      const message = reason instanceof MartApiError ? reason.message : "Could not create this order.";
      setFormError(message);
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="min-w-0 space-y-4">
      <AdminPageHeader
        title="Create order"
        description="An offline order. Prices left unchanged are calculated on the server, including quantity discounts. No storefront tracking is sent."
      />
      {formError ? (
        <p role="alert" className={cn("rounded-2xl px-4 py-3 text-sm ring-1", stockBlockMessage(formError) ? "bg-amber-50 text-amber-950 ring-amber-200" : "bg-red-50 text-red-800 ring-red-200")}>
          {formError}
        </p>
      ) : null}

      <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
        <h2 className="text-sm font-semibold text-neutral-950">Customer</h2>
        <label className="mt-3 block text-sm font-medium text-neutral-700" htmlFor="customer-search">
          Search an existing customer
        </label>
        <input id="customer-search" value={customerQuery} onChange={(event) => setCustomerQuery(event.target.value)} placeholder="Name or phone" className={cn(inputClass, "mt-1.5")} />
        {matches.length > 0 ? (
          <ul className="mt-2 overflow-hidden rounded-2xl ring-1 ring-neutral-200">
            {matches.map((match) => (
              <li key={match.phone} className="border-t border-neutral-100 first:border-t-0">
                <button type="button" onClick={() => fillCustomer(match)} className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50">
                  <span className="font-medium">{match.customerName}</span>
                  <span className="block text-xs text-neutral-500">{match.phone} · {match.orders} orders · {match.area}, {match.district}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field id="customer-name" label="Name" value={name} onChange={setName} error={errors.customerName} />
          <Field id="customer-phone" label="Phone" value={phone} onChange={setPhone} error={errors.phone} />
          <Field id="customer-email" label="Email" value={email} onChange={setEmail} error={errors.email} />
          <Field id="customer-district" label="District" value={district} onChange={setDistrict} error={errors.district} />
          <Field id="customer-area" label="Area" value={area} onChange={setArea} error={errors.area} />
          <label className="block text-sm font-medium text-neutral-700 sm:col-span-2">
            Address
            <textarea id="customer-address" value={address} onChange={(event) => setAddress(event.target.value)} rows={2} className={cn(inputClass, "mt-1.5 h-auto py-2")} />
            <FieldError message={errors.address} />
          </label>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
        <h2 className="text-sm font-semibold text-neutral-950">Items</h2>
        <div className="mt-3">
          <ProductPicker
            onPick={(choice) => {
              setLines((current) => {
                const existing = current.find((line) => line.productId === choice.productId && line.variantId === choice.variantId);
                if (existing) {
                  return current.map((line) => line === existing ? { ...line, quantity: String(Number(line.quantity) + 1) } : line);
                }
                return [
                  ...current,
                  {
                    key: `${choice.productId}:${choice.variantId ?? "product"}`,
                    productId: choice.productId,
                    variantId: choice.variantId,
                    title: choice.title,
                    optionLabel: choice.optionLabel,
                    imageSrc: choice.imageSrc,
                    quantity: "1",
                    unitPrice: String(choice.unitPrice),
                    priceEdited: false,
                    stock: choice.quantity,
                  },
                ];
              });
            }}
          />
        </div>
        <FieldError message={errors.items} />
        <ul className="mt-3 divide-y divide-neutral-100">
          {lines.map((line) => (
            <li key={line.key} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
              {line.imageSrc ? (
                <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                  <Image src={line.imageSrc} alt="" fill sizes="48px" className="object-cover" />
                </span>
              ) : null}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{line.title}</span>
                <span className="block truncate text-xs text-neutral-500">
                  {line.optionLabel || "No option"}
                  {line.stock != null && Number(line.quantity) > line.stock ? " · More than the stock shown" : ""}
                </span>
              </span>
              <label className="text-xs text-neutral-500">
                Qty
                <input
                  inputMode="numeric"
                  aria-label={`Quantity for ${line.title}`}
                  value={line.quantity}
                  onChange={(event) => setLines((current) => current.map((item) => item.key === line.key ? { ...item, quantity: event.target.value } : item))}
                  className={cn(inputClass, "mt-1 w-20")}
                />
              </label>
              <label className="text-xs text-neutral-500">
                Price
                <input
                  inputMode="numeric"
                  aria-label={`Price for ${line.title}`}
                  value={line.unitPrice}
                  onChange={(event) => setLines((current) => current.map((item) => item.key === line.key ? { ...item, unitPrice: event.target.value, priceEdited: true } : item))}
                  className={cn(inputClass, "mt-1 w-28")}
                />
              </label>
              <button type="button" className="text-sm text-red-600" onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
          <h2 className="text-sm font-semibold text-neutral-950">Payment</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-neutral-700">
              Method
              <select value={method} onChange={(event) => setMethod(event.target.value as OfflinePaymentMethod)} className={cn(inputClass, "mt-1.5")}>
                {OFFLINE_PAYMENT_METHODS.map((item) => (
                  <option key={item} value={item}>{PAYMENT_METHOD_LABEL[item]}</option>
                ))}
              </select>
              <FieldError message={errors.paymentMethod} />
            </label>
            <Field id="paid-amount" label="Paid amount" value={paid} onChange={setPaid} error={errors.paidAmount} />
            <Field id="order-discount" label="Discount" value={discount} onChange={setDiscount} error={errors.manualDiscount} />
            <Field id="delivery-charge" label="Delivery charge" value={delivery} onChange={setDelivery} error={errors.deliveryCharge} placeholder="Optional — blank is ৳0" />
            <Field id="payment-reference" label="Payment reference" value={reference} onChange={setReference} error={errors.paymentReference} />
            <label className="text-sm font-medium text-neutral-700">
              Order date
              <input type="date" max={dhakaToday()} value={orderDate} onChange={(event) => setOrderDate(event.target.value)} className={cn(inputClass, "mt-1.5")} />
              <FieldError message={errors.orderDate} />
            </label>
            <label className="text-sm font-medium text-neutral-700 sm:col-span-2">
              Note
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} className={cn(inputClass, "mt-1.5 h-auto py-2")} />
            </label>
          </div>
        </div>
        <aside className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
          <h2 className="text-sm font-semibold text-neutral-950">{preview.source === "server" ? "Server preview" : "Estimate"}</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{formatTaka(preview.subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Discount</dt><dd className="tabular-nums">{formatTaka(preview.discount)}</dd></div>
            <div className="flex justify-between"><dt>Delivery</dt><dd className="tabular-nums">{preview.shipping == null ? "Zone fee" : formatTaka(preview.shipping)}</dd></div>
            <div className="flex justify-between border-t border-neutral-100 pt-2 font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{preview.total == null ? "—" : formatTaka(preview.total)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-neutral-500">{preview.note}</p>
          <button type="submit" disabled={pending} className={cn(adminButtonClass.primary, "mt-4 w-full")}>
            {pending ? "Saving…" : "Save order"}
          </button>
        </aside>
      </section>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <label htmlFor={id} className="block text-sm font-medium text-neutral-700">
      {label}
      <input id={id} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={cn(inputClass, "mt-1.5")} />
      <FieldError message={error} />
    </label>
  );
}

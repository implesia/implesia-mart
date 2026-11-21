"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

// Custom hook to intercept all Next.js navigation
function useUnsavedChangesWarning(enabled: boolean, onAttemptLeave: () => void) {
  useEffect(() => {
    if (!enabled) return;

    // 1. Handle browser refresh / close tab
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // 2. Intercept Next.js <Link> clicks and router.push
    // Next.js uses window.history.pushState under the hood for client-side nav
    const originalPushState = window.history.pushState;
    
    window.history.pushState = function (...args) {
      // If we are trying to navigate, trigger the modal instead
      onAttemptLeave();
      
      // We do NOT call originalPushState here, which effectively blocks the navigation.
      // The modal will handle the actual navigation if the user confirms.
    };

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.history.pushState = originalPushState; // Restore original on unmount
    };
  }, [enabled, onAttemptLeave]);
}

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
  const [markDelivered, setMarkDelivered] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [quoteState, setQuoteState] = useState<{ key: string; quote: { subtotal: number; shipping: number } | null }>({
    key: "",
    quote: null,
  });

  // Unsaved changes modal state
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const customerTerm = customerQuery.trim();
  const matches = customerHits.term === customerTerm && customerTerm.length >= 2 ? customerHits.matches : [];

  // Determine if form is dirty
  const isDirty = name.trim() !== "" || phone.trim() !== "" || lines.length > 0 || address.trim() !== "";

  // Hook into unsaved changes warning
  useUnsavedChangesWarning(isDirty && !pending, () => setShowLeaveModal(true));

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
          initialStatus: markDelivered ? "delivered" : "new",
          markDelivered,
        },
        idempotencyKey.current,
      );
      
      // Force navigate away safely (bypass the modal)
      setPending(false);
      setShowLeaveModal(false);
      
      // Bypass the history hack for the final successful redirect
      window.history.pushState = function(...args) { 
        window.history.pushState = Object.getPrototypeOf(window.history).pushState.bind(window.history);
        window.history.pushState(...args);
      };
      
      router.push(`/admin/orders/${saved.id}`);
    } catch (reason) {
      const message = reason instanceof MartApiError ? reason.message : "Could not create this order.";
      setFormError(message);
      setPending(false);
    }
  }

  const handleLeaveConfirm = () => {
    setShowLeaveModal(false);
    // Force navigate away by bypassing our pushState hack
    window.history.pushState = function(...args) { 
      window.history.pushState = Object.getPrototypeOf(window.history).pushState.bind(window.history);
      window.history.pushState(...args);
    };
    router.push("/admin/orders");
  };

  return (
    <>
      <form onSubmit={(event) => void submit(event)} className="min-w-0 space-y-4 pb-10">
        <AdminPageHeader
          title="Create order"
          description="An offline order. Prices left unchanged are calculated on the server, including quantity discounts. No storefront tracking is sent."
        />
        
        {formError ? (
          <p role="alert" className={cn("rounded-xl px-4 py-3 text-sm font-medium ring-1 ring-inset", stockBlockMessage(formError) ? "bg-amber-50 text-amber-900 ring-amber-200" : "bg-red-50 text-red-800 ring-red-200")}>
            {formError}
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          
          {/* Left Column */}
          <div className="space-y-4">
            
            {/* Customer Section */}
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:p-5">
              <h2 className="text-sm font-semibold text-slate-900">Customer</h2>
              <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wide text-slate-500" htmlFor="customer-search">
                Search an existing customer
              </label>
              <input 
                id="customer-search" 
                value={customerQuery} 
                onChange={(event) => setCustomerQuery(event.target.value)} 
                placeholder="Name or phone" 
                className={cn(inputClass, "mt-1.5 h-9 text-sm")} 
              />
              
              {matches.length > 0 ? (
                <ul className="mt-2 overflow-hidden rounded-lg border border-slate-200 shadow-sm relative z-10 bg-white">
                  {matches.map((match) => (
                    <li key={match.phone} className="border-t border-slate-100 first:border-t-0">
                      <button type="button" onClick={() => fillCustomer(match)} className="block w-full px-3 py-2 text-left transition hover:bg-slate-50">
                        <span className="text-sm font-medium text-slate-900">{match.customerName}</span>
                        <span className="block text-[11px] text-slate-500">{match.phone} · {match.orders} orders · {match.area}, {match.district}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field id="customer-name" label="Name" placeholder="Enter customer name" value={name} onChange={setName} error={errors.customerName} />
                <Field id="customer-phone" label="Phone" placeholder="Enter phone number" value={phone} onChange={setPhone} error={errors.phone} />
                <Field id="customer-email" label="Email" placeholder="Enter email address" value={email} onChange={setEmail} error={errors.email} />
                <div className="grid grid-cols-2 gap-3">
                  <Field id="customer-district" label="District" placeholder="e.g. Dhaka" value={district} onChange={setDistrict} error={errors.district} />
                  <Field id="customer-area" label="Area" placeholder="e.g. Mirpur" value={area} onChange={setArea} error={errors.area} />
                </div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:col-span-2">
                  Address
                  <textarea id="customer-address" placeholder="Enter full delivery address" value={address} onChange={(event) => setAddress(event.target.value)} rows={2} className={cn(inputClass, "mt-1.5 h-auto py-2 text-sm")} />
                  <FieldError message={errors.address} />
                </label>
              </div>
            </section>

            {/* Items Section */}
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:p-5">
              <h2 className="text-sm font-semibold text-slate-900">Items</h2>
              <div className="mt-3">
                <ProductPicker
                  key={lines.length}
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
              
              <ul className="mt-3 divide-y divide-slate-100">
                {lines.map((line, index) => (
                  <li key={line.key} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-[10px] font-semibold text-slate-500">
                      {index + 1}
                    </span>
                    {line.imageSrc ? (
                      <span className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-slate-200">
                        <Image src={line.imageSrc} alt="" fill sizes="40px" className="object-cover" />
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">{line.title}</span>
                      <span className="block truncate text-[11px] font-medium text-slate-500">
                        {line.optionLabel || "No option"}
                        {line.stock != null && Number(line.quantity) > line.stock ? <span className="text-rose-600 ml-1">· More than the stock shown</span> : ""}
                      </span>
                    </span>
                    
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                        Qty
                        <input
                          inputMode="numeric"
                          aria-label={`Quantity for ${line.title}`}
                          value={line.quantity}
                          onChange={(event) => setLines((current) => current.map((item) => item.key === line.key ? { ...item, quantity: event.target.value } : item))}
                          className={cn(inputClass, "h-8 w-16 text-center text-xs")}
                        />
                      </label>
                      <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                        Price
                        <input
                          inputMode="numeric"
                          aria-label={`Price for ${line.title}`}
                          value={line.unitPrice}
                          onChange={(event) => setLines((current) => current.map((item) => item.key === line.key ? { ...item, unitPrice: event.target.value, priceEdited: true } : item))}
                          className={cn(inputClass, "h-8 w-24 text-right text-xs")}
                        />
                      </label>
                      <button type="button" className="text-xs font-semibold text-rose-600 transition hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50" onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}>
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Payment & Fulfillment Status Section */}
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:p-5">
              <h2 className="text-sm font-semibold text-slate-900">Payment &amp; Sale Status</h2>

              {/* Sale Status Toggle: Walk-in Delivered vs Pending Delivery */}
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Sale status">
                <button
                  type="button"
                  role="radio"
                  aria-checked={markDelivered}
                  onClick={() => setMarkDelivered(true)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition",
                    markDelivered
                      ? "border-[#0b3d39] bg-teal-50/50 ring-1 ring-[#0b3d39]"
                      : "border-slate-200 hover:bg-slate-50",
                  )}
                >
                  <span className="flex items-center justify-between gap-2 text-xs font-bold text-slate-950">
                    <span>Mark as Delivered immediately</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                      Walk-in / Counter
                    </span>
                  </span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-slate-600">
                    Syncs immediately into Sales, Profit, Stock &amp; Dashboard reports on the selected order date.
                  </span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={!markDelivered}
                  onClick={() => setMarkDelivered(false)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition",
                    !markDelivered
                      ? "border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500"
                      : "border-slate-200 hover:bg-slate-50",
                  )}
                >
                  <span className="flex items-center justify-between gap-2 text-xs font-bold text-slate-950">
                    <span>New (Pending Delivery)</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      Courier / Dispatch
                    </span>
                  </span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-slate-600">
                    Enters the normal fulfilment pipeline (New → Confirmed → Packed → Shipped → Delivered).
                  </span>
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Method
                  <select value={method} onChange={(event) => setMethod(event.target.value as OfflinePaymentMethod)} className={cn(inputClass, "mt-1.5 h-9 text-sm")}>
                    {OFFLINE_PAYMENT_METHODS.map((item) => (
                      <option key={item} value={item}>{PAYMENT_METHOD_LABEL[item]}</option>
                    ))}
                  </select>
                  <FieldError message={errors.paymentMethod} />
                </label>
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="paid-amount" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Paid amount
                    </label>
                    {preview.total != null && preview.total > 0 ? (
                      <button
                        type="button"
                        onClick={() => setPaid(String(preview.total))}
                        className="text-[11px] font-semibold text-[#0b3d39] hover:underline"
                      >
                        Set full ({formatTaka(preview.total)})
                      </button>
                    ) : null}
                  </div>
                  <input
                    id="paid-amount"
                    value={paid}
                    placeholder="0"
                    onChange={(event) => setPaid(event.target.value)}
                    className={cn(inputClass, "mt-1.5 h-9 text-sm")}
                  />
                  <FieldError message={errors.paidAmount} />
                </div>
                <Field id="order-discount" label="Discount" placeholder="0" value={discount} onChange={setDiscount} error={errors.manualDiscount} />
                <Field id="delivery-charge" label="Delivery charge" value={delivery} onChange={setDelivery} error={errors.deliveryCharge} placeholder="Optional — blank is ৳0" />
                <Field id="payment-reference" label="Payment reference" placeholder="e.g. TrxID (optional)" value={reference} onChange={setReference} error={errors.paymentReference} />
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Order date
                  <input type="date" max={dhakaToday()} value={orderDate} onChange={(event) => setOrderDate(event.target.value)} className={cn(inputClass, "mt-1.5 h-9 text-sm")} />
                  <FieldError message={errors.orderDate} />
                </label>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:col-span-2">
                  Note
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add any special instructions or notes here..." rows={2} className={cn(inputClass, "mt-1.5 h-auto py-2 text-sm")} />
                </label>
              </div>
            </section>
          </div>

          {/* Right Column / Summary */}
          <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:p-5 lg:sticky lg:top-4">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">{preview.source === "server" ? "Server preview" : "Estimate"}</h2>
            <dl className="mt-3 space-y-2.5 text-sm text-slate-600">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="font-medium text-slate-900 tabular-nums">{formatTaka(preview.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Discount</dt>
                <dd className="font-medium text-rose-600 tabular-nums">- {formatTaka(preview.discount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Delivery</dt>
                <dd className="font-medium text-slate-900 tabular-nums">{preview.shipping == null ? "Zone fee" : formatTaka(preview.shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900 mt-2">
                <dt>Total</dt>
                <dd className="tabular-nums">{preview.total == null ? "—" : formatTaka(preview.total)}</dd>
              </div>
            </dl>
            <p className="mt-4 rounded bg-slate-50 p-2.5 text-[11px] leading-relaxed text-slate-500 border border-slate-100">
              {preview.note}
            </p>
            <button type="submit" disabled={pending} className={cn(adminButtonClass.primary, "mt-4 h-9 w-full text-sm font-semibold shadow-sm")}>
              {pending ? "Saving…" : "Save order"}
            </button>
          </aside>
        </div>
      </form>

      {/* Unsaved Changes Modal */}
      <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-slate-900">
                  Unsaved Changes
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm leading-relaxed text-slate-500">
                  You have unsaved changes in this order. If you leave now, your progress will be lost.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowLeaveModal(false)}
              className="h-9 bg-white shadow-sm"
            >
              Keep Editing
            </Button>
            <Button
              onClick={handleLeaveConfirm}
              className="h-9 bg-rose-600 px-5 text-white shadow-sm hover:bg-rose-700 hover:scale-100"
            >
              Leave Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
    <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {label}
      <input id={id} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={cn(inputClass, "mt-1.5 h-9 text-sm")} />
      <FieldError message={error} />
    </label>
  );
}
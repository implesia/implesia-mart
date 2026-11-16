import Image from "next/image";

import { code128Svg } from "@/lib/admin/barcode";
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, isPaymentMethod, isPaymentStatus } from "@/lib/admin/orders-desk";
import {
  invoiceHeading,
  packetLabelModel,
  type PrintOrder,
} from "@/lib/admin/print-sheet";
import { qrSvg } from "@/lib/admin/qr";
import { formatTaka } from "@/lib/mart-mock/store";

const LOGO = "/images/common/logo.png";

export function PrintDocuments({ orders, kind }: { orders: PrintOrder[]; kind: "invoice" | "label" | "both" }) {
  return (
    <div id="order-print" className="space-y-6">
      <style>{`
        @page invoice { size: A4; margin: 10mm; }
        @page label { size: 4in 6in; margin: 0.15in; }
        .sheet-invoice { page: invoice; break-after: page; }
        .sheet-label { page: label; break-after: page; }
        @media print {
          .sheet-invoice, .sheet-label { box-shadow: none !important; margin: 0 !important; }
        }
      `}</style>
      {orders.map((order) => (
        <div key={order.id} className="space-y-6">
          {kind !== "label" ? <InvoiceSheet order={order} /> : null}
          {kind !== "invoice" ? <LabelSheet order={order} /> : null}
        </div>
      ))}
    </div>
  );
}

function Barcode({ value, height = 40, className = "" }: { value: string; height?: number; className?: string }) {
  let svg = "";
  try {
    svg = code128Svg(value, { barWidth: 1.6, height });
  } catch {
    return null;
  }
  return <div className={`max-w-full overflow-hidden ${className}`.trim()} dangerouslySetInnerHTML={{ __html: svg }} />;
}

function Qr({ value, moduleSize }: { value: string; moduleSize: number }) {
  let svg = "";
  try {
    svg = qrSvg(value, { moduleSize, quiet: 2 });
  } catch {
    return null;
  }
  return <div className="shrink-0" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function InvoiceSheet({ order }: { order: PrintOrder }) {
  const heading = invoiceHeading(order);
  const discount = order.manualDiscount + (order.couponDiscount ?? 0);
  const courier = [order.courierName.trim(), order.trackingNumber.trim()].filter(Boolean);
  return (
    <article className="sheet-invoice mx-auto flex min-h-[270mm] w-full max-w-[210mm] flex-col bg-white p-5 text-[13px] leading-snug text-neutral-950 shadow-sm ring-1 ring-neutral-200 print:min-h-0 print:max-w-none print:p-0 print:shadow-none print:ring-0">
      <header className="flex items-start justify-between gap-4">
        <Image src={LOGO} alt="Implesia Mart" width={140} height={36} className="h-8 w-auto" />
        <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Invoice</p>
      </header>
      <div className="mt-3 grid gap-0.5">
        <p><span className="text-neutral-500">Invoice ID</span></p>
        <p className="font-semibold">{heading.invoiceId || "—"}</p>
        <p className="mt-1 text-neutral-500">Order no</p>
        <p className="font-semibold">{heading.orderNumber}</p>
      </div>
      <p className="mt-2 text-neutral-700">Created: {heading.created}</p>
      {heading.estimatedDelivery ? <p className="text-neutral-700">Estimated delivery: {heading.estimatedDelivery}</p> : null}
      <section className="mt-3">
        <p className="font-semibold">{order.customerName}</p>
        <p>{order.phone}</p>
        {heading.email ? <p>{heading.email}</p> : null}
        {heading.address ? <p>{heading.address}</p> : null}
      </section>
      <table className="mt-3 w-full text-left">
        <thead>
          <tr className="border-b border-neutral-300 text-[11px] text-neutral-500">
            <th className="py-1 font-medium">Item</th>
            <th className="py-1 font-medium">SKU</th>
            <th className="py-1 font-medium">Product ID</th>
            <th className="py-1 text-right font-medium">Qty</th>
            <th className="py-1 text-right font-medium">Unit price</th>
            <th className="py-1 text-right font-medium">Line total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => (
            <tr key={`${item.title}-${index}`} className="border-b border-neutral-100 align-top">
              <td className="py-1 pr-2">
                {item.title}
                {item.variantLabel.trim() ? (
                  <span className="block text-[11px] text-neutral-500">{item.variantLabel}</span>
                ) : null}
              </td>
              <td className="py-1 pr-2 font-mono text-[11px]">{item.sku.trim() || "—"}</td>
              <td className="py-1 pr-2 font-mono text-[11px]">{item.productIdShort || "—"}</td>
              <td className="py-1 text-right tabular-nums">{item.quantity}</td>
              <td className="py-1 text-right tabular-nums">{formatTaka(item.unitPrice)}</td>
              <td className="py-1 text-right tabular-nums">{formatTaka(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="mt-2 ml-auto w-full max-w-[220px] space-y-0.5">
        <Row label="Subtotal" value={formatTaka(order.subtotal)} />
        <Row label="Discount" value={discount > 0 ? `−${formatTaka(discount)}` : formatTaka(0)} />
        <Row label="Delivery" value={formatTaka(order.shipping)} />
        <Row label="Total" value={formatTaka(order.total)} strong />
        <div className="flex items-baseline justify-between gap-3 border-t border-neutral-300 pt-1">
          <dt className="font-semibold">COD due</dt>
          <dd className="text-base font-bold tabular-nums">{formatTaka(order.dueAmount)}</dd>
        </div>
      </dl>
      <p className="mt-2">
        Payment: {isPaymentMethod(order.paymentMethod) ? PAYMENT_METHOD_LABEL[order.paymentMethod] : order.paymentMethod}
        {" · "}
        {isPaymentStatus(order.paymentStatus) ? PAYMENT_STATUS_LABEL[order.paymentStatus] : order.paymentStatus}
      </p>
      {courier.length > 0 ? (
        <p className="mt-1">
          {order.courierName.trim() ? <span>Courier: {order.courierName.trim()}</span> : null}
          {order.courierName.trim() && order.trackingNumber.trim() ? " · " : null}
          {order.trackingNumber.trim() ? <span>Tracking ID: {order.trackingNumber.trim()}</span> : null}
        </p>
      ) : null}
      {order.notes.trim() ? <p className="mt-1"><span className="font-semibold">Note. </span>{order.notes}</p> : null}
      <footer className="mt-auto flex items-end justify-between gap-4 pt-4">
        <div className="min-w-0">
          <Barcode value={heading.orderNumber} />
          <p className="mt-1 font-mono text-[11px]">{heading.orderNumber}</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Qr value={heading.shopUrl} moduleSize={3} />
          <p className="text-center text-[11px]">{heading.shopCaption}</p>
        </div>
      </footer>
    </article>
  );
}

function LabelSheet({ order }: { order: PrintOrder }) {
  const label = packetLabelModel(order);
  return (
    <article className="sheet-label mx-auto flex h-[6in] w-[4in] flex-col bg-white p-3 text-[13px] leading-snug text-neutral-950 shadow-sm ring-1 ring-neutral-200 print:shadow-none print:ring-0">
      <div className="flex items-start justify-between gap-2">
        <Image src={LOGO} alt="Implesia Mart" width={112} height={28} className="h-7 w-auto" />
        {label.invoiceId ? <p className="text-[11px] text-neutral-600">{label.invoiceId}</p> : null}
      </div>
      <div className="mt-2 flex flex-col items-center text-center">
        <p className="text-base font-semibold">{label.number}</p>
        <Barcode value={label.number} height={36} className="mx-auto flex justify-center [&_svg]:block" />
        <p className="mt-2 font-semibold">{label.customerName}</p>
        <p>{label.phone}</p>
        {label.address ? <p className="max-w-full">{label.address}</p> : null}
        <p className="mt-3">
          COD amount <span className="text-xl font-bold tabular-nums">{formatTaka(label.dueAmount)}</span>
        </p>
        <p>{label.itemCount} {label.itemCount === 1 ? "item" : "items"}</p>
      </div>
      {label.courier ? <p className="mt-1">{label.courier}</p> : null}
      <div className="mt-auto flex items-end justify-between gap-2 pt-2">
        {label.orderDate ? <p className="text-xs text-neutral-600">{label.orderDate}</p> : <span />}
        <Qr value={label.statusUrl} moduleSize={2} />
      </div>
    </article>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={strong ? "font-semibold" : "text-neutral-600"}>{label}</dt>
      <dd className={strong ? "font-semibold tabular-nums" : "tabular-nums"}>{value}</dd>
    </div>
  );
}

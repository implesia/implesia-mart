import Image from "next/image";

import { code128Svg } from "@/lib/admin/barcode";
import { formatDhakaDateTime } from "@/lib/admin/order-timestamps";
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, isPaymentMethod, isPaymentStatus } from "@/lib/admin/orders-desk";
import type { PrintOrder } from "@/lib/mart-api/orders-desk";
import { formatTaka } from "@/lib/mart-mock/store";

const LOGO = "/images/common/logo.png";

export function PrintDocuments({ orders, kind }: { orders: PrintOrder[]; kind: "invoice" | "label" | "both" }) {
  return (
    <div id="order-print" className="space-y-6">
      <style>{`
        @page invoice { size: A4; margin: 12mm; }
        @page label { size: 4in 6in; margin: 0.18in; }
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

function Barcode({ value }: { value: string }) {
  let svg = "";
  try {
    svg = code128Svg(value, { barWidth: 2, height: 46 });
  } catch {
    return null;
  }
  return <div className="max-w-[280px]" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function InvoiceSheet({ order }: { order: PrintOrder }) {
  const discount = order.manualDiscount + (order.couponDiscount ?? 0);
  const when = formatDhakaDateTime(order.orderedAt ?? order.createdAt);
  return (
    <article className="sheet-invoice mx-auto w-full max-w-[210mm] bg-white p-6 text-neutral-950 shadow-sm ring-1 ring-neutral-200 print:max-w-none print:p-0 print:shadow-none print:ring-0">
      <header className="flex items-start justify-between gap-4">
        <Image src={LOGO} alt="Implesia Mart" width={160} height={40} className="h-10 w-auto" />
        <div className="text-right">
          <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Invoice</p>
          <p className="text-lg font-semibold">{order.number}</p>
          <p className="text-sm text-neutral-600">{when}</p>
        </div>
      </header>
      <div className="mt-4">
        <Barcode value={order.number} />
      </div>
      <section className="mt-5 text-sm">
        <p className="font-semibold">{order.customerName}</p>
        <p>{order.phone}</p>
        <p>{order.address}</p>
        <p>{order.area}, {order.district}</p>
      </section>
      <table className="mt-5 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-300 text-xs text-neutral-500">
            <th className="py-2 font-medium">Item</th>
            <th className="py-2 text-right font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Price</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => (
            <tr key={`${item.title}-${index}`} className="border-b border-neutral-100">
              <td className="py-2">
                {item.title}
                {item.selection.length > 0 ? (
                  <span className="block text-xs text-neutral-500">{item.selection.map((choice) => choice.label).join(", ")}</span>
                ) : null}
              </td>
              <td className="py-2 text-right tabular-nums">{item.quantity}</td>
              <td className="py-2 text-right tabular-nums">{formatTaka(item.unitPrice)}</td>
              <td className="py-2 text-right tabular-nums">{formatTaka(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="mt-4 ml-auto w-full max-w-xs space-y-1 text-sm">
        <Row label="Subtotal" value={formatTaka(order.subtotal)} />
        <Row label="Discount" value={discount > 0 ? `−${formatTaka(discount)}` : formatTaka(0)} />
        <Row label="Delivery" value={formatTaka(order.shipping)} />
        <Row label="Total" value={formatTaka(order.total)} strong />
        <div className="flex items-baseline justify-between gap-3 border-t border-neutral-300 pt-2">
          <dt className="font-semibold">COD due</dt>
          <dd className="text-lg font-bold tabular-nums">{formatTaka(order.dueAmount)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm">
        Payment: {isPaymentMethod(order.paymentMethod) ? PAYMENT_METHOD_LABEL[order.paymentMethod] : order.paymentMethod}
        {" · "}
        {isPaymentStatus(order.paymentStatus) ? PAYMENT_STATUS_LABEL[order.paymentStatus] : order.paymentStatus}
      </p>
      {order.notes.trim() ? <p className="mt-2 text-sm"><span className="font-semibold">Note. </span>{order.notes}</p> : null}
      <p className="mt-8 text-center text-sm text-neutral-600">Thank you for shopping with Implesia Mart.</p>
    </article>
  );
}

function LabelSheet({ order }: { order: PrintOrder }) {
  const pieces = order.items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <article className="sheet-label mx-auto flex h-[6in] w-[4in] flex-col bg-white p-4 text-neutral-950 shadow-sm ring-1 ring-neutral-200 print:shadow-none print:ring-0">
      <Image src={LOGO} alt="Implesia Mart" width={128} height={32} className="h-8 w-auto self-start" />
      <p className="mt-3 text-lg font-semibold">{order.number}</p>
      <Barcode value={order.number} />
      <p className="mt-3 text-sm font-semibold">{order.customerName}</p>
      <p className="text-sm">{order.phone}</p>
      <p className="text-sm">{order.address}</p>
      <p className="text-sm">{order.area}, {order.district}</p>
      <p className="mt-4 text-sm">
        COD amount <span className="text-xl font-bold tabular-nums">{formatTaka(order.dueAmount)}</span>
      </p>
      <p className="mt-1 text-sm">{pieces} {pieces === 1 ? "item" : "items"}</p>
      {order.courierName.trim() || order.trackingNumber.trim() ? (
        <p className="mt-2 text-sm">
          {[order.courierName, order.trackingNumber].filter((part) => part.trim()).join(" · ")}
        </p>
      ) : null}
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

"use client";

import Link from "next/link";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { costMargin, formatMarginTaka } from "@/lib/admin/cost-price";
import {
  formatReportCount,
  formatReportMoney,
  formatReportPercent,
  type ProductAnalyticsReport,
} from "@/lib/admin/reports";
import { variantLabel } from "@/lib/mart-api/admin-variants";
import { badgeToneClass } from "@/lib/mart-api/badge-rules";
import { percentText } from "@/lib/mart-api/pricing";
import { formatTaka, type AdminProduct } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

export function ProductKpiStrip({
  product,
  analytics,
}: {
  product: AdminProduct;
  analytics: ProductAnalyticsReport | null;
}) {
  const selling = analytics?.sellingPrice ?? product.price;
  const cost = analytics?.currentCostPrice ?? product.costPrice ?? null;
  const unitMargin = cost != null ? costMargin(selling, cost) : null;
  const onHand = analytics?.currentStock ?? product.quantity;
  const stockValue =
    analytics?.currentStockValue ??
    (onHand != null && cost != null ? Math.round(onHand * cost * 100) / 100 : null);
  const lifetime = analytics?.lifetime ?? null;
  const last30 = analytics?.last30Days ?? null;

  return (
    <section aria-label="Financial and inventory metrics" className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Selling Price"
          value={formatTaka(selling)}
          hint={
            product.compareAtPrice && product.compareAtPrice > selling
              ? `Compare-at ${formatTaka(product.compareAtPrice)}`
              : product.hasVariants
                ? "Lowest active variant price"
                : "Current unit selling price"
          }
          icon="sell"
        />
        <KpiCard
          label="Cost Price"
          value={cost != null ? formatMarginTaka(cost) : "Not set"}
          valueClass={cost == null ? "text-amber-700" : undefined}
          hint={
            cost == null
              ? "Add cost price to unlock profit & margin reports"
              : "Admin-only current wholesale cost"
          }
          icon="payments"
        />
        <KpiCard
          label="Unit Profit & Margin"
          value={
            unitMargin
              ? `${unitMargin.profit < 0 ? "-" : ""}${formatMarginTaka(unitMargin.profit)}`
              : "—"
          }
          valueClass={
            unitMargin
              ? unitMargin.profit < 0
                ? "text-rose-700"
                : unitMargin.profit > 0
                  ? "text-emerald-700"
                  : "text-slate-900"
              : "text-slate-400"
          }
          badge={
            unitMargin ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
                  unitMargin.profit < 0
                    ? "bg-rose-100 text-rose-700"
                    : "bg-emerald-100 text-emerald-700",
                )}
              >
                {unitMargin.profit < 0 ? "Below cost" : ""}
                {unitMargin.percent != null
                  ? `${unitMargin.profit < 0 ? " · " : ""}${percentText(Math.abs(unitMargin.percent))}%`
                  : ""}
              </span>
            ) : null
          }
          hint={
            unitMargin && unitMargin.profit < 0
              ? "Warning: selling price is lower than cost price!"
              : "Unit profit = selling price minus cost price"
          }
          icon="trending_up"
        />
        <KpiCard
          label="On-Hand Stock & Value"
          value={onHand == null ? "Unlimited" : `${formatReportCount(onHand)} units`}
          hint={
            stockValue != null
              ? `Capital value ${formatReportMoney(stockValue)}`
              : "Made to order or cost price not set"
          }
          icon="inventory_2"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Lifetime Units Sold"
          value={lifetime ? formatReportCount(lifetime.unitsSold) : "—"}
          hint={
            last30
              ? `Last 30 days: ${formatReportCount(last30.unitsSold)} units · ${lifetime?.returnCount ?? 0} returns`
              : "Realized delivered units"
          }
          icon="shopping_bag"
        />
        <KpiCard
          label="Lifetime Revenue"
          value={lifetime ? formatReportMoney(lifetime.revenue) : "—"}
          hint={
            last30
              ? `Last 30 days: ${formatReportMoney(last30.revenue)}`
              : "Net realized merchandise revenue"
          }
          icon="account_balance_wallet"
        />
        <KpiCard
          label="Lifetime Profit / Loss"
          value={lifetime ? formatReportMoney(lifetime.profit) : "—"}
          valueClass={
            lifetime?.profit != null
              ? lifetime.profit < 0
                ? "text-rose-700"
                : "text-emerald-700"
              : undefined
          }
          badge={
            lifetime?.marginPercent != null ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
                  lifetime.isLoss
                    ? "bg-rose-100 text-rose-700"
                    : "bg-emerald-100 text-emerald-700",
                )}
              >
                {formatReportPercent(lifetime.marginPercent)}
              </span>
            ) : null
          }
          hint={
            last30
              ? `Last 30 days: ${formatReportMoney(last30.profit)} (COGS ${formatReportMoney(lifetime?.cogs ?? null)})`
              : "Realized profit across known-cost lines"
          }
          icon="monitoring"
        />
        <KpiCard
          label="Potential Retail Value"
          value={formatReportMoney(analytics?.potentialRetailValue ?? null)}
          hint={
            analytics?.currentStock != null && analytics.currentStock <= 5
              ? "Low stock alert (≤ 5 units remaining)"
              : "Current stock × current selling price"
          }
          icon="storefront"
        />
      </div>
    </section>
  );
}

function KpiCard({
  label,
  value,
  valueClass,
  badge,
  hint,
  icon,
}: {
  label: string;
  value: string;
  valueClass?: string;
  badge?: React.ReactNode;
  hint: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <MaterialIcon name={icon} className="text-[18px] text-slate-400" />
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        <p className={cn("text-xl font-bold tabular-nums text-slate-900", valueClass)}>{value}</p>
        {badge}
      </div>
      <p className="mt-1.5 text-[11px] font-medium text-slate-500">{hint}</p>
    </div>
  );
}

export function VariantsBreakdownTable({ product }: { product: AdminProduct }) {
  const variants = product.variants ?? [];
  if (!product.hasVariants && variants.length === 0) return null;
  const groups = product.content.options;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Variants Breakdown</h2>
          <p className="text-xs text-slate-500">
            Per-variant pricing, cost, unit profit/margin, and active stock.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 tabular-nums">
          {variants.length} variants
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Option</th>
              <th className="px-4 py-2.5 font-semibold">SKU</th>
              <th className="px-4 py-2.5 text-right font-semibold">Selling Price</th>
              <th className="px-4 py-2.5 text-right font-semibold">Cost Price</th>
              <th className="px-4 py-2.5 text-right font-semibold">Profit / Margin</th>
              <th className="px-4 py-2.5 text-right font-semibold">Stock</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {variants.map((variant, idx) => {
              const label = variant.label || variantLabel(groups, variant.options) || `Variant ${idx + 1}`;
              const effectiveCost = variant.costPrice ?? product.costPrice ?? null;
              const margin = effectiveCost != null ? costMargin(variant.price, effectiveCost) : null;
              return (
                <tr key={variant.id ?? idx} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-900">{label}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {variant.sku || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                    {formatTaka(variant.price)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {variant.costPrice != null
                      ? formatMarginTaka(variant.costPrice)
                      : product.costPrice != null
                        ? `${formatMarginTaka(product.costPrice)} (base)`
                        : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {margin ? (
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                          margin.profit < 0
                            ? "bg-rose-50 text-rose-700"
                            : "bg-emerald-50 text-emerald-700",
                        )}
                      >
                        {margin.profit < 0 ? "-" : "+"}
                        {formatMarginTaka(margin.profit)}
                        {margin.percent != null
                          ? ` (${percentText(Math.abs(margin.percent))}%)`
                          : ""}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                    {variant.quantity == null ? "Unlimited" : variant.quantity}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                        variant.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {variant.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ProductDetailsSummary({ product }: { product: AdminProduct }) {
  const { content } = product;
  const tiers = product.quantityTiers ?? [];
  const badges = product.badges ?? [];
  const seoTitle = product.seoTitle?.trim() || product.title;
  const seoDesc =
    product.seoDescription?.trim() || content.description?.trim() || product.subtitle || "";

  return (
    <div className="space-y-4">
      {/* Description & Highlights */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">Product Details</h2>
        {product.subtitle ? (
          <p className="mt-1 text-sm font-medium text-slate-600">{product.subtitle}</p>
        ) : null}
        {content.description ? (
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {content.description}
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-400">No long description provided.</p>
        )}

        {content.highlights.length > 0 ? (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Highlights
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {content.highlights.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Badges & Quantity Tiers */}
        <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Assigned Badges
            </h3>
            {badges.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {badges.map((b) => (
                  <span
                    key={b.id}
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      badgeToneClass(b.tone),
                    )}
                  >
                    {b.name}
                    {!b.isActive ? " (inactive)" : ""}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1.5 text-xs text-slate-400">No badges assigned.</p>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Quantity Tiers ({product.tierMode ?? "global"})
            </h3>
            {tiers.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs text-slate-700">
                {tiers.map((tier, idx) => (
                  <li key={idx} className="tabular-nums">
                    Buy <strong>{tier.minQuantity}+</strong> → extra{" "}
                    <strong>{percentText(tier.extraPercent)}%</strong> off
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-xs text-slate-400">
                {product.tierMode === "custom"
                  ? "No custom quantity tiers."
                  : "Follows global store quantity tiers."}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Specifications */}
      {content.specs.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900">Specifications</h2>
          <dl className="mt-3 divide-y divide-slate-100 text-sm">
            {content.specs.map((spec) => (
              <div
                key={spec.id}
                className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[12rem_1fr]"
              >
                <dt className="font-medium text-slate-500">{spec.label}</dt>
                <dd className="font-medium text-slate-900">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {/* FAQs */}
      {content.faqs.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900">FAQs</h2>
          <dl className="mt-3 space-y-3 text-sm">
            {content.faqs.map((faq) => (
              <div key={faq.id} className="rounded-xl bg-slate-50/70 p-3">
                <dt className="font-semibold text-slate-900">{faq.question}</dt>
                <dd className="mt-1 text-slate-600">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {/* SEO Snippet Preview */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">SEO Snippet Preview</h2>
        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="text-xs text-emerald-700">implesiamart.com › products › {product.slug}</p>
          <p className="mt-1 text-base font-semibold text-indigo-700">{seoTitle}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
            {seoDesc || "No meta description set."}
          </p>
          {product.seoKeywords ? (
            <p className="mt-2 text-[11px] text-slate-400">Keywords: {product.seoKeywords}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export function RecentMovementsCard({
  productId,
  analytics,
}: {
  productId: string;
  analytics: ProductAnalyticsReport | null;
}) {
  const movements = analytics?.recentMovements ?? [];
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Recent Stock Movements</h2>
          <p className="text-xs text-slate-500">
            Latest immutable ledger entries for this product.
          </p>
        </div>
        <Link
          href={`/admin/inventory/stock?product_id=${encodeURIComponent(productId)}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Full stock history
          <MaterialIcon name="arrow_forward" className="text-[16px]" />
        </Link>
      </div>

      {movements.length === 0 ? (
        <p className="p-5 text-sm text-slate-500">No stock movements recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Type</th>
                <th className="px-4 py-2.5 text-right font-semibold">Qty</th>
                <th className="px-4 py-2.5 text-right font-semibold">Unit Cost</th>
                <th className="px-4 py-2.5 font-semibold">Note</th>
                <th className="px-4 py-2.5 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((mv) => (
                <tr key={mv.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2.5">
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold capitalize text-slate-700">
                      {mv.movementType}
                    </span>
                  </td>
                  <td
                    className={cn(
                      "px-4 py-2.5 text-right font-bold tabular-nums",
                      mv.quantity > 0
                        ? "text-emerald-700"
                        : mv.quantity < 0
                          ? "text-rose-700"
                          : "text-slate-600",
                    )}
                  >
                    {mv.quantity > 0 ? `+${mv.quantity}` : mv.quantity}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                    {mv.unitCost != null ? formatMarginTaka(mv.unitCost) : "—"}
                  </td>
                  <td className="max-w-xs truncate px-4 py-2.5 text-xs text-slate-600">
                    {mv.note || "—"}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-xs text-slate-500 tabular-nums">
                    {new Intl.DateTimeFormat("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(mv.createdAt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

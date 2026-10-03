"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  DASHBOARD_RANGE_OPTIONS,
  getDashboardOverview,
  type DashboardRangeId,
  type DashboardSnapshot,
  type DashboardTrend,
} from "@/lib/mart-api/dashboard";
import { MartApiError } from "@/lib/mart-api/products";
import { cn } from "@/lib/utils";

import { RevenueChart } from "./revenue-chart";
import {
  BestSellingProducts,
  OrderActivity,
  OrderAreas,
  RecentOrders,
  SalesInsights,
} from "./dashboard-sections";

export function DashboardView() {
  const [rangeId, setRangeId] = useState<DashboardRangeId>("7d");
  const [customFrom, setCustomFrom] = useState(inputDate(-6));
  const [customTo, setCustomTo] = useState(inputDate(0));
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getDashboardOverview({
      range: rangeId,
      from: customFrom,
      to: customTo,
    })
      .then((next) => {
        if (cancelled) return;
        setSnapshot(next);
        setError("");
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(
          loadError instanceof MartApiError
            ? loadError.message
            : "Could not load the dashboard.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [rangeId, customFrom, customTo, refreshKey]);

  if (!snapshot && !error) return <DashboardSkeleton />;
  if (!snapshot) {
    return (
      <p className="rounded-2xl bg-white px-4 py-10 text-center text-sm text-red-700 ring-1 ring-red-100">
        {error}
      </p>
    );
  }

  const ordersHref =
    rangeId === "today" ? "/admin/orders?day=today" : "/admin/orders";

  function refresh() {
    setError("");
    setUpdatedAt(new Date());
    setRefreshKey((key) => key + 1);
  }

  return (
    <div className="min-w-0 space-y-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            {snapshot.periodLabel}
            <span className="text-neutral-400"> · </span>
            <span className="text-neutral-500">{snapshot.comparisonLabel}</span>
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="min-w-0 sm:min-w-44">
            <span className="sr-only">Reporting period</span>
            <select
              value={rangeId}
              onChange={(event) => {
                setError("");
                setRangeId(event.target.value as DashboardRangeId);
              }}
              className="h-10 w-full rounded-full border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/25"
            >
              {DASHBOARD_RANGE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {rangeId === "custom" ? (
            <div className="flex items-center gap-2">
              <DateField
                label="From"
                value={customFrom}
                onChange={(value) => {
                  setError("");
                  setCustomFrom(value);
                }}
              />
              <DateField
                label="To"
                value={customTo}
                onChange={(value) => {
                  setError("");
                  setCustomTo(value);
                }}
              />
            </div>
          ) : null}
          <button
            type="button"
            onClick={refresh}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-white px-3.5 text-sm font-medium text-neutral-800 ring-1 ring-neutral-200 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <MaterialIcon name="refresh" className="text-[18px]" />
            Refresh
          </button>
          {updatedAt ? (
            <p className="text-xs text-neutral-500">
              Updated{" "}
              {new Intl.DateTimeFormat("en-US", {
                hour: "numeric",
                minute: "2-digit",
              }).format(updatedAt)}
            </p>
          ) : null}
        </div>
      </header>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section aria-label="Key figures" className="grid gap-3 lg:grid-cols-12">
        <KpiCard
          className="lg:col-span-5"
          href={ordersHref}
          label="Revenue"
          value={snapshot.revenue.display}
          trend={snapshot.revenue.trend}
          sparkline={snapshot.revenue.sparkline}
          icon="payments"
          featured
          note="Excludes cancelled and returned orders."
        />
        <KpiCard
          className="lg:col-span-3"
          href={ordersHref}
          label="Orders"
          value={snapshot.orders.display}
          trend={snapshot.orders.trend}
          sparkline={snapshot.orders.sparkline}
          icon="shopping_bag"
          note="Every order placed in this period."
        />
        <div className="grid h-full grid-cols-2 gap-3 lg:col-span-4">
          <KpiCard
            label="Avg. order"
            value={snapshot.averageOrderValue.display}
            trend={snapshot.averageOrderValue.trend}
            icon="receipt_long"
            compact
          />
          <KpiCard
            label="Customers"
            value={snapshot.customers.display}
            trend={snapshot.customers.trend}
            icon="group"
            compact
          />
          <KpiCard
            href="/admin/orders?status=new"
            label="Pending"
            value={snapshot.pending.display}
            trend={snapshot.pending.trend}
            icon="pending_actions"
            compact
            alert={snapshot.pending.value > 0}
            higherIsWorse
          />
          <KpiCard
            href="/admin/orders?status=delivered"
            label="Delivered"
            value={snapshot.delivered.display}
            trend={snapshot.delivered.trend}
            icon="check_circle"
            compact
          />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-neutral-950">
            Revenue and orders
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Revenue bars with order volume, against the previous period.
          </p>
        </div>
        <RevenueChart
          points={snapshot.series}
          grainLabel={snapshot.grainLabel}
        />
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <OrderActivity
          statuses={snapshot.statuses}
          total={snapshot.orderCount}
        />
        <BestSellingProducts products={snapshot.bestSellers} />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <RecentOrders orders={snapshot.recent} />
        <div className="space-y-4">
          <OrderAreas areas={snapshot.areas} />
          <SalesInsights categories={snapshot.categories} />
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  className,
  href,
  label,
  value,
  trend,
  sparkline,
  icon,
  featured,
  compact,
  alert,
  note,
  higherIsWorse,
}: {
  className?: string;
  href?: string;
  label: string;
  value: string;
  trend: DashboardTrend;
  sparkline?: number[];
  icon: string;
  featured?: boolean;
  compact?: boolean;
  alert?: boolean;
  note?: string;
  higherIsWorse?: boolean;
}) {
  const body = (
    <>
      <span className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg",
            alert
              ? "bg-amber-50 text-amber-700"
              : featured
                ? "bg-primary/10 text-primary"
                : "bg-[#f5f6f8] text-neutral-700",
          )}
        >
          <MaterialIcon name={icon} className="text-[18px]" />
        </span>
        {href ? (
          <MaterialIcon
            name="arrow_outward"
            className="text-[16px] text-neutral-300 group-hover:text-primary"
          />
        ) : null}
      </span>
      <span
        className={cn(
          "mt-3 block text-sm text-neutral-600",
          compact && "mt-2.5",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "mt-1 block font-semibold tracking-tight tabular-nums text-neutral-950",
          featured ? "text-3xl" : compact ? "text-xl" : "text-2xl",
        )}
      >
        {value}
      </span>
      <TrendLine trend={trend} higherIsWorse={higherIsWorse} />
      {featured && sparkline && sparkline.some((point) => point > 0) ? (
        <Sparkline values={sparkline} className="mt-3 text-primary" />
      ) : null}
      {!featured && sparkline && sparkline.some((point) => point > 0) ? (
        <Sparkline values={sparkline} className="mt-3 text-neutral-800" />
      ) : null}
      {note ? (
        <span className="mt-2 block text-xs leading-4 text-neutral-500">
          {note}
        </span>
      ) : null}
    </>
  );
  const classNames = cn(
    "group flex h-full flex-col rounded-2xl bg-white px-3.5 py-3.5 ring-1 ring-neutral-200/90 transition duration-150",
    href && "hover:-translate-y-px hover:ring-neutral-300",
    alert && "ring-amber-200",
    className,
  );
  if (!href) return <article className={classNames}>{body}</article>;
  return (
    <Link href={href} className={classNames}>
      {body}
    </Link>
  );
}

function TrendLine({
  trend,
  higherIsWorse,
}: {
  trend: DashboardTrend;
  higherIsWorse?: boolean;
}) {
  const rising = trend.direction === "up" || trend.direction === "new";
  const falling = trend.direction === "down";
  const positive = higherIsWorse ? falling : rising;
  const negative = higherIsWorse ? rising : falling;
  const tone = positive
    ? "text-emerald-700"
    : negative
      ? "text-red-600"
      : "text-neutral-500";
  const icon =
    trend.direction === "down"
      ? "arrow_downward"
      : trend.direction === "flat"
        ? "remove"
        : "arrow_upward";
  return (
    <span
      className={cn(
        "mt-1.5 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs font-medium leading-4",
        tone,
      )}
    >
      <MaterialIcon name={icon} className="text-[14px]" />
      <span>{trend.text}</span>
      <span className="font-normal text-neutral-500">vs previous period</span>
    </span>
  );
}

function Sparkline({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  const peak = Math.max(1, ...values);
  const width = 160;
  const height = 36;
  const step = values.length <= 1 ? width : width / (values.length - 1);
  const line = values
    .map((value, index) => {
      const x = index * step;
      const y = height - (value / peak) * (height - 4) - 2;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      className={cn("h-9 w-full", className)}
    >
      <path d={line} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-full bg-white px-3 ring-1 ring-neutral-200">
      <span className="text-xs text-neutral-500">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 bg-transparent text-sm text-neutral-950 outline-none"
      />
    </label>
  );
}

function inputDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-16 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="h-44 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90 lg:col-span-5" />
        <div className="h-44 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90 lg:col-span-3" />
        <div className="grid grid-cols-2 gap-3 lg:col-span-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90"
            />
          ))}
        </div>
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
        <div className="h-64 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
      </div>
    </div>
  );
}

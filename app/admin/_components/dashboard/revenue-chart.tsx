"use client";

import { useState } from "react";

import { formatTaka } from "@/lib/mart-mock/store";
import { type DashboardPoint } from "@/lib/mart-api/dashboard";
import { formatCompactTaka } from "@/lib/mart-mock/dashboard";
import { cn } from "@/lib/utils";

export function RevenueChart({
  points,
  grainLabel,
}: {
  points: DashboardPoint[];
  grainLabel: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const hasActivity = points.some(
    (point) =>
      point.orders > 0 || point.revenue > 0 || point.previousRevenue > 0,
  );
  if (!hasActivity) {
    return (
      <p className="px-1 py-16 text-center text-sm text-neutral-500">
        No order data available for this period.
      </p>
    );
  }

  const width = 720;
  const height = 228;
  const pad = { left: 56, right: 12, top: 16, bottom: 28 };
  const innerWidth = width - pad.left - pad.right;
  const innerHeight = height - pad.top - pad.bottom;
  const peak = Math.max(
    1,
    ...points.map((point) => Math.max(point.revenue, point.previousRevenue)),
  );
  const orderPeak = Math.max(1, ...points.map((point) => point.orders));
  const slot = innerWidth / points.length;
  const barWidth = Math.min(22, slot * 0.46);
  const ticks = [peak, peak / 2, 0];
  const selected = active == null ? null : points[active];

  function x(index: number) {
    return pad.left + slot * index + slot / 2;
  }
  function yRevenue(value: number) {
    return pad.top + innerHeight - (value / peak) * innerHeight;
  }
  function yOrders(value: number) {
    return pad.top + innerHeight - (value / orderPeak) * innerHeight;
  }

  const orderLine = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${x(index)} ${yOrders(point.orders)}`,
    )
    .join(" ");
  const previousLine = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${x(index)} ${yRevenue(point.previousRevenue)}`,
    )
    .join(" ");
  const labelStep =
    points.length > 16
      ? Math.ceil(points.length / 8)
      : points.length > 8
        ? 2
        : 1;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
        <span className="font-medium text-neutral-700">{grainLabel}</span>
        <Legend swatch="bg-primary" label="Revenue" />
        <Legend swatch="bg-neutral-950" label="Orders" />
        <span className="inline-flex items-center gap-2">
          <span className="h-px w-4 border-t border-dashed border-neutral-400" />
          Previous revenue
        </span>
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`${grainLabel} revenue and order volume`}
          className="h-56 w-full"
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={yRevenue(tick)}
                y2={yRevenue(tick)}
                stroke="#e5e7eb"
              />
              <text
                x={pad.left - 8}
                y={yRevenue(tick) + 4}
                textAnchor="end"
                fill="#737373"
                fontSize="11"
              >
                {formatCompactTaka(tick)}
              </text>
            </g>
          ))}
          <path
            d={previousLine}
            fill="none"
            stroke="#a3a3a3"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
          {points.map((point, index) => {
            const barHeight = (point.revenue / peak) * innerHeight;
            return (
              <rect
                key={point.label + index}
                x={x(index) - barWidth / 2}
                y={pad.top + innerHeight - barHeight}
                width={barWidth}
                height={Math.max(barHeight, point.revenue > 0 ? 2 : 0)}
                rx="3"
                fill={active === index ? "#14998f" : "#2bc0b5"}
              />
            );
          })}
          <path d={orderLine} fill="none" stroke="#171717" strokeWidth="1.75" />
          {points.map((point, index) => (
            <circle
              key={`dot-${point.label}-${index}`}
              cx={x(index)}
              cy={yOrders(point.orders)}
              r="2.5"
              fill="#171717"
            />
          ))}
          {points.map((point, index) => (
            <text
              key={`label-${point.label}-${index}`}
              x={x(index)}
              y={height - 8}
              textAnchor="middle"
              fill="#737373"
              fontSize="11"
              opacity={index % labelStep === 0 ? 1 : 0}
            >
              {point.label}
            </text>
          ))}
          {points.map((point, index) => (
            <rect
              key={`hit-${index}`}
              x={pad.left + slot * index}
              y={pad.top}
              width={slot}
              height={innerHeight}
              fill="transparent"
              tabIndex={0}
              role="button"
              aria-label={`${point.label}: ${formatTaka(point.revenue)}, ${point.orders} orders`}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
            />
          ))}
        </svg>
        {selected && active != null ? (
          <div
            className="pointer-events-none absolute z-10 w-44 rounded-xl bg-neutral-950 px-3 py-2 text-xs text-white shadow-lg"
            style={{
              left: `${((active + 0.5) / points.length) * 100}%`,
              top: 8,
              transform:
                active > points.length * 0.7
                  ? "translateX(-100%)"
                  : "translateX(-20%)",
            }}
          >
            <p className="font-semibold">{selected.label}</p>
            <p className="mt-1 text-white/80">
              Revenue {formatTaka(selected.revenue)}
            </p>
            <p className="text-white/80">Orders {selected.orders}</p>
            <p className="text-white/60">
              Previous {formatTaka(selected.previousRevenue)}
            </p>
          </div>
        ) : null}
      </div>
      <table className="sr-only">
        <caption>{grainLabel} revenue, orders, and previous revenue</caption>
        <thead>
          <tr>
            <th>Period</th>
            <th>Revenue</th>
            <th>Orders</th>
            <th>Previous revenue</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point, index) => (
            <tr key={`${point.label}-${index}`}>
              <td>{point.label}</td>
              <td>{formatTaka(point.revenue)}</td>
              <td>{point.orders}</td>
              <td>{formatTaka(point.previousRevenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", swatch)} />
      {label}
    </span>
  );
}

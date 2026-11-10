"use client";

import { formatCompactTaka } from "@/lib/mart-mock/dashboard";
import {
  formatBucketLabel,
  formatReportMoney,
  type ReportGrain,
  type TrendPoint,
} from "@/lib/admin/reports";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ChartRow = {
  label: string;
  start: string;
  net: number;
  profit: number | null;
};

export function SalesTrendChart({
  points,
  grain,
  empty,
}: {
  points: TrendPoint[];
  grain: ReportGrain;
  empty?: boolean;
}) {
  const rows: ChartRow[] = points.map((point) => ({
    label: formatBucketLabel(point.start, grain),
    start: point.start,
    net: point.netSales,
    profit: point.profit,
  }));
  const quiet =
    empty ||
    rows.every((row) => row.net === 0 && (row.profit == null || row.profit === 0));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" />
          Net sales
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-secondary" />
          Profit
        </span>
        <span>Asia/Dhaka · {grain}</span>
      </div>
      {quiet ? (
        <p className="px-1 py-16 text-center text-sm text-neutral-600">No sales in this period.</p>
      ) : (
        <div className="h-72 w-full min-w-0" role="img" aria-label={`${grain} net sales and profit`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-outline-variant)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--color-neutral-500)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                width={72}
                tickFormatter={(value: number) => formatCompactTaka(value)}
                tick={{ fill: "var(--color-neutral-500)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0]?.payload as ChartRow | undefined;
                  if (!row) return null;
                  return (
                    <div className="rounded-xl bg-admin-ink px-3 py-2 text-xs text-white shadow-lg">
                      <p className="font-semibold">{row.label}</p>
                      <p className="mt-1">Net sales {formatReportMoney(row.net)}</p>
                      <p>Profit {formatReportMoney(row.profit)}</p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="net"
                name="Net sales"
                stroke="var(--color-primary)"
                fill="var(--color-primary)"
                fillOpacity={0.16}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="profit"
                name="Profit"
                stroke="var(--color-secondary)"
                fill="var(--color-secondary)"
                fillOpacity={0.1}
                strokeWidth={2}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <table className="sr-only">
        <caption>Net sales and profit by {grain}</caption>
        <thead>
          <tr>
            <th>Period</th>
            <th>Net sales</th>
            <th>Profit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.start}>
              <td>{row.label}</td>
              <td>{formatReportMoney(row.net)}</td>
              <td>{formatReportMoney(row.profit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

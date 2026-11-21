"use client";

import { formatCompactTaka } from "@/lib/mart-mock/dashboard";
import {
  formatBucketLabel,
  formatReportMoney,
  type ReportGrain,
  type TrendPoint,
} from "@/lib/admin/reports";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";

type ChartRow = {
  label: string;
  start: string;
  net: number;
  cost: number | null;
  profit: number | null;
};

export function SalesTrendChart({
  points,
  grain,
  empty,
  showCost = false,
}: {
  points: TrendPoint[];
  grain: ReportGrain;
  empty?: boolean;
  showCost?: boolean;
}) {
  const rows: ChartRow[] = points.map((point) => ({
    label: formatBucketLabel(point.start, grain),
    start: point.start,
    net: point.netSales,
    cost: point.profit != null ? Math.max(Math.round((point.netSales - point.profit) * 100) / 100, 0) : null,
    profit: point.profit,
  }));

  const quiet =
    empty ||
    rows.every((row) => row.net === 0 && (row.profit == null || row.profit === 0));

  return (
    <div className="w-full">
      {/* Header & Legend */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#2bc0b5]/10 px-2 py-1 text-[11px] font-semibold text-[#0b3d39] ring-1 ring-inset ring-[#2bc0b5]/25">
            <span className="h-2 w-2 rounded-full bg-[#2bc0b5]" />
            Revenue (Net Sales)
          </span>
          {showCost ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-200/70">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Cost (COGS)
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200/60">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            Profit
          </span>
        </div>
        <span className="text-[11px] font-medium text-slate-500">Asia/Dhaka · {grain}</span>
      </div>

      {quiet ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-100">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-900">No sales in this period</h3>
          <p className="mt-1 text-xs font-medium text-slate-500">Try adjusting your date range or filters.</p>
        </div>
      ) : (
        <div className="h-72 w-full min-w-0" role="img" aria-label={`${grain} net sales, cost, and profit`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2bc0b5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2bc0b5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

              <XAxis
                dataKey="label"
                tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                dy={8}
              />
              <YAxis
                width={72}
                tickFormatter={(value: number) => formatCompactTaka(value)}
                tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0]?.payload as ChartRow | undefined;
                  if (!row) return null;
                  return (
                    <div className="min-w-[160px] rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-3 shadow-xl">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {row.label}
                      </p>
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#2bc0b5]" />
                            Net Sales
                          </span>
                          <span className="text-xs font-bold tabular-nums text-white">
                            {formatReportMoney(row.net)}
                          </span>
                        </div>
                        {showCost ? (
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                              Cost (COGS)
                            </span>
                            <span className="text-xs font-bold tabular-nums text-white">
                              {formatReportMoney(row.cost)}
                            </span>
                          </div>
                        ) : null}
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                            Profit
                          </span>
                          <span className="text-xs font-bold tabular-nums text-white">
                            {formatReportMoney(row.profit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="net"
                name="Net sales"
                stroke="#2bc0b5"
                strokeWidth={2.5}
                fill="url(#netGradient)"
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: "#2bc0b5" }}
              />
              {showCost ? (
                <Area
                  type="monotone"
                  dataKey="cost"
                  name="Cost (COGS)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  fill="url(#costGradient)"
                  connectNulls={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: "#f59e0b" }}
                />
              ) : null}
              <Area
                type="monotone"
                dataKey="profit"
                name="Profit"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#profitGradient)"
                connectNulls={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: "#6366f1" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Accessible Data Table */}
      <table className="sr-only">
        <caption>Net sales, cost, and profit by {grain}</caption>
        <thead>
          <tr>
            <th>Period</th>
            <th>Net sales</th>
            {showCost ? <th>Cost</th> : null}
            <th>Profit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.start}>
              <td>{row.label}</td>
              <td>{formatReportMoney(row.net)}</td>
              {showCost ? <td>{formatReportMoney(row.cost)}</td> : null}
              <td>{formatReportMoney(row.profit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
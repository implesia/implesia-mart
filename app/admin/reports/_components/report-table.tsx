"use client";

import { cn } from "@/lib/utils";

export type ReportColumn<T> = {
  id: string;
  label: string;
  align?: "left" | "right";
  sortValue: (row: T) => string | number | null;
  render: (row: T) => React.ReactNode;
};

export function ReportTable<T>({
  caption,
  rows,
  columns,
  sort,
  direction,
  onSort,
  rowKey,
}: {
  caption: string;
  rows: T[];
  columns: ReportColumn<T>[];
  sort: string;
  direction: "asc" | "desc";
  onSort: (column: string) => void;
  rowKey: (row: T) => string;
}) {
  return (
    <div className="overflow-x-auto">
  <table className="w-full min-w-[40rem] text-left text-sm">
    <caption className="sr-only">{caption}</caption>
    
    {/* Table Header */}
    <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500">
      <tr>
        {columns.map((column) => {
          const active = sort === column.id;
          const ariaSort = active ? (direction === "asc" ? "ascending" : "descending") : "none";
          return (
            <th
              key={column.id}
              aria-sort={ariaSort}
              className={cn(
                "whitespace-nowrap px-4 py-2.5 font-semibold",
                column.align === "right" && "text-right",
                column.id === columns[0]?.id && "sticky left-0 z-10 border-r border-slate-200 bg-slate-50/80",
              )}
            >
              <button
                type="button"
                onClick={() => onSort(column.id)}
                className={cn(
                  "group inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2bc0b5]/40",
                  column.align === "right" && "ml-auto",
                  active ? "text-slate-900" : "text-slate-500",
                )}
              >
                {column.label}
                <span
                  aria-hidden
                  className={cn(
                    "inline-flex shrink-0 transition-all duration-200",
                    active ? "text-[#2bc0b5]" : "text-slate-300 opacity-0 group-hover:opacity-100",
                  )}
                >
                  {active ? (
                    direction === "asc" ? (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7l4-4m0 0l4 4m-4-4v18" />
                      </svg>
                    ) : (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 17l-4 4m0 0l-4-4m4 4V3" />
                      </svg>
                    )
                  ) : (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                  )}
                </span>
              </button>
            </th>
          );
        })}
      </tr>
    </thead>

    {/* Table Body */}
    <tbody className="divide-y divide-slate-100">
      {rows.map((row) => (
        <tr key={rowKey(row)} className="group transition-colors hover:bg-slate-50/80">
          {columns.map((column) => (
            <td
              key={column.id}
              className={cn(
                "px-4 py-3 text-slate-700",
                column.align === "right" && "text-right tabular-nums",
                column.id === columns[0]?.id && "sticky left-0 z-10 border-r border-slate-100 bg-white font-medium text-slate-900 group-hover:bg-slate-50",
              )}
            >
              {column.render(row)}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
</div>
  );
}

export function sortRows<T>(
  rows: T[],
  columns: ReportColumn<T>[],
  sort: string,
  direction: "asc" | "desc",
) {
  const column = columns.find((item) => item.id === sort) ?? columns[0];
  if (!column) return rows;
  const factor = direction === "asc" ? 1 : -1;
  return [...rows].sort((left, right) => {
    const a = column.sortValue(left);
    const b = column.sortValue(right);
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    if (typeof a === "number" && typeof b === "number") return (a - b) * factor;
    return String(a).localeCompare(String(b)) * factor;
  });
}

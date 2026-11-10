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
        <thead className="bg-admin-subtle text-xs text-neutral-600">
          <tr>
            {columns.map((column) => {
              const active = sort === column.id;
              const ariaSort = active ? (direction === "asc" ? "ascending" : "descending") : "none";
              return (
                <th
                  key={column.id}
                  aria-sort={ariaSort}
                  className={cn(
                    "px-4 py-2 font-medium whitespace-nowrap",
                    column.align === "right" && "text-right",
                    column.id === columns[0]?.id && "sticky left-0 bg-admin-subtle",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSort(column.id)}
                    className={cn(
                      "inline-flex min-h-10 items-center gap-1 rounded-lg px-1 focus-visible:outline-2 focus-visible:outline-primary",
                      column.align === "right" && "ml-auto",
                    )}
                  >
                    {column.label}
                    <span aria-hidden className="text-neutral-500">
                      {active ? (direction === "asc" ? "↑" : "↓") : ""}
                    </span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-t border-neutral-100">
              {columns.map((column) => (
                <td
                  key={column.id}
                  className={cn(
                    "px-4 py-2.5 text-neutral-800",
                    column.align === "right" && "text-right tabular-nums",
                    column.id === columns[0]?.id && "sticky left-0 bg-white font-medium text-neutral-950",
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

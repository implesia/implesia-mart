"use client";

export function InventoryPager({
  page,
  pages,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
}) {
  if (total <= 0) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-4 py-3 text-sm"
    >
      <span className="text-neutral-600">
        {start}–{end} of {total}
      </span>
      <span className="flex gap-2">
        <button
          type="button"
          className="min-h-10 rounded-full px-4 ring-1 ring-neutral-200 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="min-h-10 rounded-full px-4 ring-1 ring-neutral-200 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </span>
    </nav>
  );
}

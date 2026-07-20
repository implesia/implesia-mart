/**
 * Shared pagination helpers — usable from any listing (products, blogs, etc.).
 */

export const DEFAULT_PAGE_SIZE = 12;

export function getTotalPages(totalItems: number, pageSize: number = DEFAULT_PAGE_SIZE) {
  if (totalItems <= 0) return 1;
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(1, page), Math.max(1, totalPages));
}

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number = DEFAULT_PAGE_SIZE,
): T[] {
  const totalPages = getTotalPages(items.length, pageSize);
  const safePage = clampPage(page, totalPages);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function getPageRangeMeta(
  totalItems: number,
  page: number,
  pageSize: number = DEFAULT_PAGE_SIZE,
) {
  if (totalItems <= 0) {
    return { start: 0, end: 0, total: 0, totalPages: 1, page: 1 };
  }

  const totalPages = getTotalPages(totalItems, pageSize);
  const safePage = clampPage(page, totalPages);
  const start = (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalItems);

  return { start, end, total: totalItems, totalPages, page: safePage };
}

/**
 * Builds a compact page list with ellipsis, e.g. [1, "ellipsis", 4, 5, 6, "ellipsis", 12]
 */
export function buildPaginationItems(
  current: number,
  totalPages: number,
  siblingCount = 1,
): Array<number | "ellipsis"> {
  if (totalPages <= 1) return [1];

  const totalNumbers = siblingCount * 2 + 5; // first, last, current, 2 ellipsis slots

  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(current - siblingCount, 1);
  const rightSibling = Math.min(current + siblingCount, totalPages);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftItemCount = 3 + siblingCount * 2;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, "ellipsis", totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightItemCount = 3 + siblingCount * 2;
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + 1 + i,
    );
    return [1, "ellipsis", ...rightRange];
  }

  const middleRange = Array.from(
    { length: rightSibling - leftSibling + 1 },
    (_, i) => leftSibling + i,
  );

  return [1, "ellipsis", ...middleRange, "ellipsis", totalPages];
}

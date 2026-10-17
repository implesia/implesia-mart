"use client";

import Image from "next/image";
import Link from "next/link";
import {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";

import type { CategoryTile } from "@/lib/mart-api/categories";
import { buildCategoryTree, type CategoryNode } from "@/lib/mart-api/category-tree";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../common/material-icon";

type Node = CategoryNode<CategoryTile>;
/** One open flyout: the node whose children it lists and the row it is anchored to. */
type OpenLevel = { id: string; rect: DOMRect };

const OPEN_DELAY_MS = 90;
const AIM_DELAY_MS = 320;
const CLOSE_DELAY_MS = 380;

function hrefOf(tile: CategoryTile) {
  return tile.href || "/products";
}

/** Point-in-triangle test used for the "safe triangle" towards an open flyout. */
function inTriangle(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
) {
  const sign = (p1: typeof p, p2: typeof p, p3: typeof p) =>
    (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
  const d1 = sign(p, a, b);
  const d2 = sign(p, b, c);
  const d3 = sign(p, c, a);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

function menuItems(container: Element | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(":scope > li > [role='menuitem']"));
}

export function CategoryNav({ tiles }: { tiles: CategoryTile[] }) {
  const tree = useMemo(() => buildCategoryTree(tiles), [tiles]);
  const byId = useMemo(() => {
    const map = new Map<string, Node>();
    const walk = (nodes: Node[]) => {
      for (const node of nodes) {
        map.set(node.item.id, node);
        walk(node.children);
      }
    };
    walk(tree);
    return map;
  }, [tree]);

  if (tree.length === 0) return null;
  return (
    <>
      <MobileCategoryNav tree={tree} byId={byId} />
      <DesktopCategoryMenu tree={tree} byId={byId} />
    </>
  );
}

/* ----------------------------------------------------------------------------------------------
 * Desktop: vertical menu with hover/keyboard flyouts rendered in a portal so the scrolling
 * sidebar never clips them.
 * -------------------------------------------------------------------------------------------- */

function DesktopCategoryMenu({ tree, byId }: { tree: Node[]; byId: Map<string, Node> }) {
  const [path, setPath] = useState<OpenLevel[]>([]);
  const baseId = useId();
  const timer = useRef<number | null>(null);
  const pointer = useRef<{ x: number; y: number; px: number; py: number }>({ x: 0, y: 0, px: 0, py: 0 });
  const pointerType = useRef<string>("mouse");
  const pendingFocus = useRef<number | null>(null);
  const rows = useRef(new Map<string, HTMLElement>());
  const flyouts = useRef(new Map<number, HTMLElement>());
  const rootList = useRef<HTMLUListElement | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const closeFrom = useCallback((level: number) => {
    setPath((prev) => (prev.length > level ? prev.slice(0, level) : prev));
  }, []);

  const openAt = useCallback(
    (level: number, node: Node, el: HTMLElement) => {
      setPath((prev) => {
        if (node.children.length === 0) return prev.length > level ? prev.slice(0, level) : prev;
        if (prev[level]?.id === node.item.id && prev.length === level + 1) return prev;
        return [...prev.slice(0, level), { id: node.item.id, rect: el.getBoundingClientRect() }];
      });
    },
    [],
  );

  // Moving towards the already-open flyout of this level? Then switching rows waits longer.
  const aimingAt = useCallback((level: number) => {
    const flyout = flyouts.current.get(level);
    if (!flyout) return false;
    const r = flyout.getBoundingClientRect();
    const { x, y, px, py } = pointer.current;
    const towardsRight = r.left >= px;
    const edge = towardsRight ? r.left : r.right;
    return inTriangle({ x, y }, { x: px, y: py }, { x: edge, y: r.top - 40 }, { x: edge, y: r.bottom + 40 });
  }, []);

  const onRowPointerEnter = useCallback(
    (level: number, node: Node, event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType !== "mouse") return;
      clearTimer();
      const el = event.currentTarget;
      const delay = aimingAt(level) ? AIM_DELAY_MS : OPEN_DELAY_MS;
      timer.current = window.setTimeout(() => {
        timer.current = null;
        openAt(level, node, el);
      }, delay);
    },
    [aimingAt, clearTimer, openAt],
  );

  const onAreaPointerMove = useCallback((event: ReactPointerEvent) => {
    const p = pointer.current;
    pointer.current = { x: event.clientX, y: event.clientY, px: p.x, py: p.y };
  }, []);

  const onAreaPointerEnter = useCallback(
    (event: ReactPointerEvent) => {
      if (event.pointerType === "mouse") clearTimer();
    },
    [clearTimer],
  );

  const onAreaPointerLeave = useCallback(
    (event: ReactPointerEvent) => {
      if (event.pointerType !== "mouse") return;
      clearTimer();
      timer.current = window.setTimeout(() => {
        timer.current = null;
        setPath((prev) => (prev.length ? [] : prev));
      }, CLOSE_DELAY_MS);
    },
    [clearTimer],
  );

  // Positions are snapshots of the row rect, so any scroll or resize closes the flyouts.
  useEffect(() => {
    if (path.length === 0) return;
    const close = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-category-flyout]")) return;
      setPath([]);
    };
    const outside = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest("[data-category-flyout]") || rootList.current?.contains(target)) return;
      setPath([]);
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("pointerdown", outside);
    };
  }, [path.length]);

  useEffect(() => clearTimer, [clearTimer]);

  const onRowClick = useCallback(
    (level: number, node: Node, event: React.MouseEvent<HTMLAnchorElement>) => {
      // Touch/pen on a wide screen: the first tap opens the flyout, the second follows the link.
      if (pointerType.current === "mouse" || node.children.length === 0) return;
      const open = path[level]?.id === node.item.id;
      if (!open) {
        event.preventDefault();
        openAt(level, node, event.currentTarget);
      }
    },
    [openAt, path],
  );

  const onRowKeyDown = useCallback(
    (level: number, node: Node, event: ReactKeyboardEvent<HTMLAnchorElement>) => {
      const container = event.currentTarget.closest("[role='menu']");
      const items = menuItems(container);
      const index = items.indexOf(event.currentTarget);
      const focusAt = (i: number) => items[(i + items.length) % items.length]?.focus();
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          focusAt(index + 1);
          break;
        case "ArrowUp":
          event.preventDefault();
          focusAt(index - 1);
          break;
        case "Home":
          event.preventDefault();
          focusAt(0);
          break;
        case "End":
          event.preventDefault();
          focusAt(items.length - 1);
          break;
        case "ArrowRight":
          if (node.children.length > 0) {
            event.preventDefault();
            pendingFocus.current = level + 1;
            openAt(level, node, event.currentTarget);
            // Already open: focus the first child right away.
            const flyout = flyouts.current.get(level);
            if (flyout && path[level]?.id === node.item.id) {
              pendingFocus.current = null;
              menuItems(flyout.querySelector("[role='menu']"))[0]?.focus();
            }
          }
          break;
        case "ArrowLeft":
        case "Escape": {
          event.preventDefault();
          if (level === 0) {
            setPath([]);
            break;
          }
          const parent = path[level - 1];
          closeFrom(level - 1);
          if (parent) rows.current.get(parent.id)?.focus();
          break;
        }
        case "Tab":
          setPath([]);
          break;
      }
    },
    [closeFrom, openAt, path],
  );

  const registerRow = useCallback((id: string, el: HTMLElement | null) => {
    if (el) rows.current.set(id, el);
    else rows.current.delete(id);
  }, []);

  const registerFlyout = useCallback((level: number, el: HTMLElement | null) => {
    if (el) flyouts.current.set(level, el);
    else flyouts.current.delete(level);
  }, []);

  const rowProps = {
    baseId,
    path,
    registerRow,
    onRowPointerEnter,
    onRowClick,
    onRowKeyDown,
  };

  return (
    <div
      className="hidden min-h-0 flex-1 lg:flex"
      onPointerMove={onAreaPointerMove}
      onPointerDown={(event) => {
        pointerType.current = event.pointerType;
      }}
    >
      <ul
        ref={rootList}
        role="menu"
        aria-orientation="vertical"
        aria-label="Categories"
        onPointerEnter={onAreaPointerEnter}
        onPointerLeave={onAreaPointerLeave}
        className="custom-scrollbar -mx-1 flex min-h-0 w-full flex-1 flex-col gap-0.5 overflow-x-hidden overflow-y-auto overscroll-contain px-1 py-0.5"
      >
        {tree.map((node, index) => (
          <li key={node.item.id} role="none">
            <MenuRow node={node} level={0} index={index} variant="root" {...rowProps} />
          </li>
        ))}
      </ul>

      {path.map((open, level) => {
        const node = byId.get(open.id);
        if (!node) return null;
        return (
          <Flyout
            key={`${level}-${open.id}`}
            level={level}
            anchor={open.rect}
            node={node}
            baseId={baseId}
            focusFirstRef={pendingFocus}
            register={registerFlyout}
            onPointerEnter={onAreaPointerEnter}
            onPointerLeave={onAreaPointerLeave}
            onPointerMove={onAreaPointerMove}
          >
            {node.children.map((child, index) => (
              <li key={child.item.id} role="none">
                <MenuRow node={child} level={level + 1} index={index} variant="flyout" {...rowProps} />
              </li>
            ))}
          </Flyout>
        );
      })}
    </div>
  );
}

type RowProps = {
  node: Node;
  level: number;
  index: number;
  variant: "root" | "flyout";
  baseId: string;
  path: OpenLevel[];
  registerRow: (id: string, el: HTMLElement | null) => void;
  onRowPointerEnter: (level: number, node: Node, event: ReactPointerEvent<HTMLElement>) => void;
  onRowClick: (level: number, node: Node, event: React.MouseEvent<HTMLAnchorElement>) => void;
  onRowKeyDown: (level: number, node: Node, event: ReactKeyboardEvent<HTMLAnchorElement>) => void;
};

const MenuRow = memo(function MenuRow({
  node,
  level,
  variant,
  baseId,
  path,
  registerRow,
  onRowPointerEnter,
  onRowClick,
  onRowKeyDown,
}: RowProps) {
  const tile = node.item;
  const hasChildren = node.children.length > 0;
  const expanded = path[level]?.id === tile.id;
  const ref = useCallback((el: HTMLAnchorElement | null) => registerRow(tile.id, el), [registerRow, tile.id]);

  return (
    <Link
      ref={ref}
      href={hrefOf(tile)}
      role="menuitem"
      aria-haspopup={hasChildren ? "menu" : undefined}
      aria-expanded={hasChildren ? expanded : undefined}
      aria-controls={hasChildren && expanded ? `${baseId}-menu-${level}` : undefined}
      onPointerEnter={(event) => onRowPointerEnter(level, node, event)}
      onClick={(event) => onRowClick(level, node, event)}
      onKeyDown={(event) => onRowKeyDown(level, node, event)}
      className={cn(
        "group flex min-h-11 items-center gap-3 rounded-xl outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        variant === "root" ? "px-2 py-1.5" : "px-2.5 py-2",
        expanded ? "bg-primary/8 text-primary" : "text-neutral-950 hover:bg-neutral-50",
      )}
    >
      {variant === "root" ? <CategoryThumb src={tile.imageSrc} size="size-11" /> : null}
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm tracking-tight transition-colors group-hover:text-primary",
          variant === "root" ? "font-semibold" : "font-medium",
        )}
      >
        {tile.label}
      </span>
      {hasChildren ? (
        <MaterialIcon
          name="chevron_right"
          className={cn(
            "text-[18px] transition-transform group-hover:translate-x-0.5",
            expanded ? "text-primary" : "text-neutral-400 group-hover:text-primary",
          )}
        />
      ) : null}
    </Link>
  );
});

function Flyout({
  level,
  anchor,
  node,
  baseId,
  focusFirstRef,
  register,
  onPointerEnter,
  onPointerLeave,
  onPointerMove,
  children,
}: {
  level: number;
  anchor: DOMRect;
  node: Node;
  baseId: string;
  focusFirstRef: React.RefObject<number | null>;
  register: (level: number, el: HTMLElement | null) => void;
  onPointerEnter: (event: ReactPointerEvent) => void;
  onPointerLeave: (event: ReactPointerEvent) => void;
  onPointerMove: (event: ReactPointerEvent) => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  // Place next to the anchor row; flip left when there is no room, clamp to the viewport.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const gap = 6;
    const margin = 8;
    const { width, height } = el.getBoundingClientRect();
    let left = anchor.right + gap;
    if (left + width > window.innerWidth - margin) left = Math.max(margin, anchor.left - width - gap);
    let top = anchor.top - 6;
    top = Math.min(top, window.innerHeight - height - margin);
    top = Math.max(margin, top);
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.visibility = "visible";
    if (focusFirstRef.current === level + 1) {
      focusFirstRef.current = null;
      menuItems(el.querySelector("[role='menu']"))[0]?.focus();
    }
  }, [anchor, focusFirstRef, level]);

  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      ref.current = el;
      register(level, el);
    },
    [level, register],
  );

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={setRef}
      data-category-flyout=""
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerMove={onPointerMove}
      style={{ position: "fixed", left: 0, top: 0, visibility: "hidden", zIndex: 60 + level }}
      className="force-light w-60 rounded-2xl bg-white p-1.5 shadow-[0_18px_44px_rgba(16,24,40,0.16)] ring-1 ring-neutral-200/90 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150"
    >
      <p className="truncate px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
        {node.item.label}
      </p>
      <ul
        id={`${baseId}-menu-${level}`}
        role="menu"
        aria-orientation="vertical"
        aria-label={node.item.label}
        className="custom-scrollbar max-h-[min(70vh,28rem)] overflow-x-hidden overflow-y-auto overscroll-contain"
      >
        {children}
      </ul>
    </div>,
    document.body,
  );
}

/* ----------------------------------------------------------------------------------------------
 * Phones and tablets: the existing snap rail of round tiles. A tile with subcategories opens a
 * drill-down panel below the rail instead of navigating straight away.
 * -------------------------------------------------------------------------------------------- */

function MobileCategoryNav({ tree, byId }: { tree: Node[]; byId: Map<string, Node> }) {
  const [trail, setTrail] = useState<string[]>([]);
  const panelId = useId();
  const current = trail.length ? byId.get(trail[trail.length - 1] ?? "") : undefined;
  const rootOpen = trail[0];
  const headingRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (trail.length) headingRef.current?.focus();
  }, [trail]);

  return (
    <div className="lg:hidden">
      <ul className="-mx-3 flex snap-x snap-mandatory scroll-px-3 gap-2 overflow-x-auto overscroll-x-contain px-3 pt-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:-mx-4 sm:scroll-px-4 sm:gap-3 sm:px-4 [&::-webkit-scrollbar]:hidden">
        {tree.map((node) => {
          const tile = node.item;
          const hasChildren = node.children.length > 0;
          const active = rootOpen === tile.id;
          return (
            <li key={tile.id} className="w-[4.5rem] shrink-0 snap-start sm:w-20">
              <Link
                href={hrefOf(tile)}
                aria-expanded={hasChildren ? active : undefined}
                aria-controls={hasChildren && active ? panelId : undefined}
                onClick={(event) => {
                  if (!hasChildren) return;
                  event.preventDefault();
                  setTrail(active ? [] : [tile.id]);
                }}
                className="group flex min-h-11 flex-col items-center gap-1.5 rounded-xl py-1 focus-visible:outline-2 focus-visible:outline-primary"
              >
                <CategoryThumb
                  src={tile.imageSrc}
                  size="size-16 sm:size-[4.5rem]"
                  active={active}
                />
                <span
                  className={cn(
                    "line-clamp-2 text-center text-xs leading-snug font-semibold tracking-tight transition-colors group-hover:text-primary",
                    active ? "text-primary" : "text-neutral-950",
                  )}
                >
                  {tile.label}
                  {hasChildren ? (
                    <MaterialIcon
                      name={active ? "expand_less" : "expand_more"}
                      className="ml-0.5 align-middle text-[14px]"
                    />
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {current ? (
        <div id={panelId} className="mt-2 border-t border-neutral-200 pt-2" aria-live="polite">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTrail((prev) => prev.slice(0, -1))}
              aria-label={trail.length > 1 ? "Back" : "Close"}
              className="grid size-11 shrink-0 place-items-center rounded-full text-neutral-600 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <MaterialIcon name={trail.length > 1 ? "arrow_back" : "close"} className="text-[20px]" />
            </button>
            <p
              ref={headingRef}
              tabIndex={-1}
              className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-950 outline-none"
            >
              {trail
                .map((id) => byId.get(id)?.item.label)
                .filter(Boolean)
                .join(" › ")}
            </p>
          </div>
          <ul className="mt-1 divide-y divide-neutral-100">
            <li>
              <Link
                href={hrefOf(current.item)}
                className="flex min-h-12 items-center gap-2 px-2 text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-primary"
              >
                View All — {current.item.label}
                <MaterialIcon name="arrow_forward" className="ml-auto text-[18px]" />
              </Link>
            </li>
            {current.children.map((child) => (
              <li key={child.item.id} className="flex items-stretch">
                <Link
                  href={hrefOf(child.item)}
                  className="flex min-h-12 min-w-0 flex-1 items-center px-2 text-sm font-medium text-neutral-900 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <span className="truncate">{child.item.label}</span>
                </Link>
                {child.children.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setTrail((prev) => [...prev, child.item.id])}
                    aria-label={`${child.item.label}: subcategories`}
                    aria-expanded={false}
                    className="grid min-h-12 w-12 shrink-0 place-items-center border-l border-neutral-100 text-neutral-500 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <MaterialIcon name="chevron_right" className="text-[20px]" />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function CategoryThumb({
  src,
  size = "size-12",
  active = false,
}: {
  src: string;
  size?: string;
  active?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-full bg-neutral-100 shadow-[0_8px_20px_rgba(16,24,40,0.08)] ring-4 transition duration-300 group-hover:ring-primary/30",
        active ? "ring-primary/40" : "ring-white",
        size,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="80px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <span className="grid size-full place-items-center text-neutral-400">
          <MaterialIcon name="category" className="text-[18px]" />
        </span>
      )}
    </span>
  );
}

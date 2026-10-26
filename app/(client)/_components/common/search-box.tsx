"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";
import {
  cleanSearchQuery,
  fetchSearch,
  searchHref,
  type SearchResults,
} from "@/lib/mart-api/search";
import { buildSearchOptions, SEARCH_PRODUCT_LIMIT } from "@/lib/mart-api/search-options";

import { MaterialIcon } from "./material-icon";

const DEBOUNCE_MS = 250;
const CACHE_LIMIT = 20;

type Status = "idle" | "loading" | "ready" | "error";

type SearchBoxProps = {
  variant: "desktop" | "mobile";
  /** Called after the shopper picks a result or submits, so a parent drawer can close. */
  onNavigate?: () => void;
};

export function SearchBox({ variant, onNavigate }: SearchBoxProps) {
  const router = useRouter();
  const pathname = usePathname();
  const prefix = useId().replace(/:/g, "");
  const listId = `${prefix}-list`;
  const root = useRef<HTMLFormElement>(null);
  const [value, setValue] = useState("");
  // The path the panel was opened on: moving to another page closes it without an effect.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, SearchResults | "error">>({});
  const [active, setActive] = useState(-1);

  const open = openedAt === pathname;
  const query = cleanSearchQuery(value);
  const key = query.toLowerCase();
  const answer = key ? answers[key] : undefined;
  const status: Status = !query
    ? "idle"
    : answer === undefined
      ? "loading"
      : answer === "error"
        ? "error"
        : "ready";
  const results = answer && answer !== "error" ? answer : null;
  const options = useMemo(() => buildSearchOptions(results, query, prefix), [results, query, prefix]);
  const showPanel = open && query.length > 0;

  function setOpen(next: boolean) {
    setOpenedAt(next ? pathname : null);
  }

  useEffect(() => {
    // Nothing to ask for a blank box, and a question already answered is not asked twice.
    if (!key || answer !== undefined) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      let next: SearchResults | "error";
      try {
        next = await fetchSearch({ q: query, pageSize: SEARCH_PRODUCT_LIMIT, signal: controller.signal });
      } catch {
        next = "error";
      }
      if (controller.signal.aborted) return;
      setAnswers((current) => {
        const keep = Object.entries(current).slice(-(CACHE_LIMIT - 1));
        return { ...Object.fromEntries(keep), [key]: next };
      });
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [key, query, answer]);

  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (root.current && !root.current.contains(event.target as Node)) setOpenedAt(null);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  function go(href: string) {
    setOpen(false);
    setActive(-1);
    onNavigate?.();
    router.push(href);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const chosen = showPanel && status === "ready" ? options[active] : undefined;
    if (chosen) return go(chosen.href);
    go(query ? searchHref(query) : "/products");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    if (!query) return;
    event.preventDefault();
    if (!open) {
      setOpen(true);
      return;
    }
    if (status !== "ready" || options.length === 0) return;
    const step = event.key === "ArrowDown" ? 1 : -1;
    // Positions are -1 (none) .. last; shift by one so the wrap-around stays simple.
    setActive((current) => ((current + 1 + step + options.length + 1) % (options.length + 1)) - 1);
  }

  const announce =
    status === "loading"
      ? "খোঁজা হচ্ছে"
      : status === "error"
        ? "এখন খোঁজা যাচ্ছে না"
        : status === "ready"
          ? results && results.products.total + results.blogs.total > 0
            ? `${results.products.total} টি প্রোডাক্ট, ${results.blogs.total} টি ব্লগ পাওয়া গেছে`
            : "কিছু পাওয়া যায়নি"
          : "";

  const desktop = variant === "desktop";
  return (
    <form
      ref={root}
      role="search"
      onSubmit={submit}
      className={desktop ? "relative hidden w-[clamp(18rem,34vw,32rem)] lg:block" : "relative mb-4"}
    >
      {desktop ? null : (
        <MaterialIcon
          name="search"
          className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-[20px] text-neutral-400"
        />
      )}
      <div className="flex w-full">
        <input
          type="search"
          name="q"
          value={value}
          autoComplete="off"
          maxLength={200}
          placeholder="প্রোডাক্ট খুঁজুন..."
          aria-label="প্রোডাক্ট খুঁজুন"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && active >= 0 ? options[active]?.id : undefined}
          onChange={(event) => {
            setValue(event.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(
            "h-11 min-w-0 flex-1 border border-neutral-200 bg-white text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400",
            desktop ? "rounded-l-md border-r-0 px-4" : "w-full rounded-md py-2 pr-4 pl-10",
          )}
        />
        {desktop ? (
          <button
            type="submit"
            className="grid size-11 shrink-0 place-items-center rounded-r-md bg-neutral-950 text-white transition-colors hover:bg-black"
            aria-label="খুঁজুন"
          >
            <MaterialIcon name="search" className="text-[20px]" />
          </button>
        ) : null}
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {showPanel ? announce : ""}
      </p>

      {showPanel ? (
        <div
          className={cn(
            "z-50 overflow-hidden rounded-md border border-neutral-200 bg-white text-neutral-900 shadow-lg",
            desktop
              ? "absolute top-full right-0 left-0 mt-1"
              : "mt-1 w-full",
          )}
        >
          {status === "loading" ? (
            <p className="px-4 py-3 text-sm text-neutral-500">খোঁজা হচ্ছে…</p>
          ) : null}

          {status === "error" ? (
            <div role="alert" className="px-4 py-3 text-sm">
              <p className="text-neutral-700">এখন খোঁজা যাচ্ছে না।</p>
              <button
                type="button"
                className="mt-2 font-semibold text-primary underline"
                onClick={() =>
                  setAnswers((current) => Object.fromEntries(Object.entries(current).filter(([k]) => k !== key)))
                }
              >
                আবার চেষ্টা করুন
              </button>
            </div>
          ) : null}

          {status === "ready" && results && options.length === 1 ? (
            <p className="px-4 py-3 text-sm text-neutral-600">
              “{query}” এর জন্য কিছু পাওয়া যায়নি।
            </p>
          ) : null}

          {status === "ready" && options.length > 1 ? (
            <ul id={listId} role="listbox" aria-label="খোঁজার ফল" className="max-h-[60vh] overflow-y-auto py-1">
              {options.map((option, index) => (
                <li key={option.id} role="presentation">
                  {index > 0 && options[index - 1].kind !== option.kind && option.kind === "blog" ? (
                    <p className="px-4 pt-2 pb-1 text-[11px] font-semibold text-neutral-500">ব্লগ</p>
                  ) : null}
                  {index === 0 && option.kind === "product" ? (
                    <p className="px-4 pt-2 pb-1 text-[11px] font-semibold text-neutral-500">প্রোডাক্ট</p>
                  ) : null}
                  <Link
                    id={option.id}
                    role="option"
                    aria-selected={index === active}
                    href={option.href}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => {
                      setOpen(false);
                      onNavigate?.();
                    }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm",
                      index === active ? "bg-neutral-100" : "hover:bg-neutral-50",
                      option.kind === "all" && "border-t border-neutral-200 font-semibold text-primary",
                    )}
                  >
                    {option.kind !== "all" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={option.image || undefined}
                        alt=""
                        loading="lazy"
                        className="size-10 shrink-0 rounded bg-neutral-100 object-cover"
                      />
                    ) : null}
                    <span className="min-w-0 flex-1 truncate">{option.title}</span>
                    {option.detail ? (
                      <span className="shrink-0 text-xs text-neutral-500">{option.detail}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

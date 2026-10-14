"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  deleteHeroSlide,
  heroImage,
  listHeroSlides,
  moveHeroSlide,
  updateHeroSlide,
  type AdminHeroSlide,
} from "@/lib/mart-api/hero";
import { MartApiError } from "@/lib/mart-api/products";
import { type HeroAccent } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import { adminButtonClass, AdminLoading } from "../../_components/admin-ui";
import { BannerSettingsEditor } from "../_components/banner-settings-editor";
import { HomeCmsHeader } from "../_components/home-cms-header";

type PublishFilter = "all" | "live" | "off";

const PREVIEW_BG: Record<HeroAccent, string> = {
  gold: "bg-[#1c1408]",
  teal: "bg-[#071820]",
  rose: "bg-[#1a0c14]",
  ink: "bg-[#071018]",
};

function isFilter(value: string | null): value is Exclude<PublishFilter, "all"> {
  return value === "live" || value === "off";
}

function heroHref(filter: PublishFilter) {
  if (filter === "all") return "/admin/home/hero";
  return `/admin/home/hero?status=${filter}`;
}

function HeroSlidesView() {
  const params = useSearchParams();
  const raw = params.get("status");
  const filter: PublishFilter = isFilter(raw) ? raw : "all";
  const [banners, setBanners] = useState<AdminHeroSlide[] | null>(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  useEffect(() => {
    let cancelled = false;
    listHeroSlides()
      .then((next) => {
        if (!cancelled) {
          setBanners(next);
          setError("");
        }
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(loadError instanceof MartApiError ? loadError.message : "Could not load hero slides.");
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (!banners && !error) return <AdminLoading />;
  if (!banners) {
    return <p className="rounded-2xl bg-white px-4 py-10 text-center text-sm text-red-700 ring-1 ring-red-100">{error}</p>;
  }

  const canReorder = filter === "all" && !needle;
  const firstLiveId = banners.find((banner) => banner.published && banner.imageSrc)?.id;

  async function change(banner: AdminHeroSlide, published: boolean) {
    setError("");
    try {
      await updateHeroSlide(banner.id, { ...banner, published });
      setReloadKey((key) => key + 1);
    } catch (actionError) {
      setError(actionError instanceof MartApiError ? actionError.message : "Could not update the slide.");
    }
  }

  async function move(id: string, direction: "earlier" | "later") {
    setError("");
    try {
      await moveHeroSlide(id, direction);
      setReloadKey((key) => key + 1);
    } catch (actionError) {
      setError(actionError instanceof MartApiError ? actionError.message : "Could not reorder the slide.");
    }
  }

  async function remove(id: string) {
    setError("");
    try {
      await deleteHeroSlide(id);
      setReloadKey((key) => key + 1);
    } catch (actionError) {
      setError(actionError instanceof MartApiError ? actionError.message : "Could not delete the slide.");
    }
  }

  const counts = {
    all: banners.length,
    live: banners.filter((banner) => banner.published).length,
    off: banners.filter((banner) => !banner.published).length,
  };
  const visible = banners.flatMap((banner, index) => {
    if (filter === "live" && !banner.published) return [];
    if (filter === "off" && banner.published) return [];
    const matches =
      !needle ||
      [banner.eyebrow, banner.title, banner.description, banner.priceLabel, banner.primaryCtaLabel]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    return matches ? [{ banner, position: index + 1, isFirst: index === 0, isLast: index === banners.length - 1 }] : [];
  });

  return (
    <div>
      <HomeCmsHeader
        title="Hero"
        description="The carousel at the top of the home page. Visitors see published slides in this order, starting with the first one."
        sectionId="hero"
        autosave
        extra={
          <Link href="/admin/home/hero/new" className={adminButtonClass.primary}>
            <MaterialIcon name="add" className="text-[18px]" />
            New slide
          </Link>
        }
      />

      <BannerSettingsEditor />

      {error ? <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
        <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex rounded-full bg-[#f5f6f8] p-1" role="tablist" aria-label="Filter slides">
            <FilterPill href={heroHref("all")} label="All" count={counts.all} active={filter === "all"} />
            <FilterPill href={heroHref("live")} label="Live" count={counts.live} active={filter === "live"} />
            <FilterPill href={heroHref("off")} label="Hidden" count={counts.off} active={filter === "off"} />
          </div>
          <label className="relative block w-full sm:w-72">
            <MaterialIcon
              name="search"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[18px] text-neutral-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title or price"
              aria-label="Search slides"
              className="h-10 w-full rounded-full border border-neutral-200 bg-[#f5f6f8] pr-3 pl-9 text-sm text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-primary focus:bg-white focus:ring-3 focus:ring-primary/25"
            />
          </label>
        </div>

        {!canReorder && visible.length > 0 ? (
          <p className="border-b border-neutral-100 bg-[#fafbfc] px-5 py-2.5 text-xs text-neutral-500">
            Switch to All and clear search to change the slide order.
          </p>
        ) : null}

        {visible.length === 0 ? (
          <EmptyState filtered={Boolean(needle) || filter !== "all"} />
        ) : (
          <ol>
            {visible.map(({ banner, position, isFirst, isLast }) => (
              <SlideRow
                key={banner.id}
                banner={banner}
                position={position}
                showsFirst={banner.id === firstLiveId}
                canReorder={canReorder}
                isFirst={isFirst}
                isLast={isLast}
                onToggle={(published) => void change(banner, published)}
                onMove={(direction) => void move(banner.id, direction)}
                onDelete={() => void remove(banner.id)}
              />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function FilterPill({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium",
        active ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500 hover:text-neutral-800",
      )}
    >
      {label}
      <span className={cn("text-xs tabular-nums", active ? "text-primary" : "text-neutral-400")}>{count}</span>
    </Link>
  );
}

function SlideRow({
  banner,
  position,
  showsFirst,
  canReorder,
  isFirst,
  isLast,
  onToggle,
  onMove,
  onDelete,
}: {
  banner: AdminHeroSlide;
  position: number;
  showsFirst: boolean;
  canReorder: boolean;
  isFirst: boolean;
  isLast: boolean;
  onToggle: (published: boolean) => void;
  onMove: (direction: "earlier" | "later") => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <li className="border-t border-neutral-100 first:border-t-0">
      <div className="flex flex-col gap-3 px-4 py-4 sm:px-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <span className="w-6 shrink-0 text-center text-sm font-semibold tabular-nums text-neutral-400">
            {position}
          </span>
          <Link
            href={`/admin/home/hero/${banner.id}`}
            className={cn(
              "relative block h-16 w-28 shrink-0 overflow-hidden rounded-xl sm:h-18 sm:w-36",
              PREVIEW_BG[banner.accent],
            )}
          >
            {banner.imageSrc ? (
              <Image src={heroImage(banner.imageSrc)} alt="" fill sizes="144px" className="object-contain p-1.5" />
            ) : (
              <span className="grid h-full place-items-center text-[11px] text-white/50">No image</span>
            )}
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {banner.eyebrow ? (
                <span className="truncate text-[11px] font-medium text-primary">{banner.eyebrow}</span>
              ) : null}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  banner.published ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500",
                )}
              >
                {banner.published ? "Live" : "Hidden"}
              </span>
              {showsFirst ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  Shows first
                </span>
              ) : null}
            </div>
            <Link
              href={`/admin/home/hero/${banner.id}`}
              className="mt-1 block truncate text-sm font-semibold text-neutral-950 hover:text-primary"
            >
              {banner.title || "Untitled slide"}
            </Link>
            <p className="mt-0.5 truncate text-xs text-neutral-500">
              {[banner.priceLabel, banner.primaryCtaLabel].filter(Boolean).join(" · ") || "Add a price and button"}
            </p>
          </div>
        </div>

        {confirmDelete ? (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            Delete this slide?
            <button
              type="button"
              onClick={onDelete}
              className="font-semibold underline"
            >
              Delete
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="font-semibold">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => onToggle(!banner.published)}
              className="inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
            >
              {banner.published ? "Hide" : "Publish"}
            </button>
            <IconButton
              label="Move earlier"
              icon="arrow_upward"
              disabled={!canReorder || isFirst}
              onClick={() => onMove("earlier")}
            />
            <IconButton
              label="Move later"
              icon="arrow_downward"
              disabled={!canReorder || isLast}
              onClick={() => onMove("later")}
            />
            <Link
              href={`/admin/home/hero/${banner.id}`}
              className="inline-flex h-9 items-center rounded-full bg-neutral-950 px-3 text-xs font-semibold text-white hover:bg-neutral-800"
            >
              Edit
            </Link>
            <IconButton label="Delete slide" icon="delete" danger onClick={() => setConfirmDelete(true)} />
          </div>
        )}
      </div>
    </li>
  );
}

function IconButton({
  label,
  icon,
  onClick,
  danger,
  disabled,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-9 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 disabled:opacity-30",
        danger && "hover:bg-red-50 hover:text-red-600",
      )}
    >
      <MaterialIcon name={icon} className="text-[18px]" />
    </button>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="px-5 py-16 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f5f6f8] text-neutral-500">
        <MaterialIcon name="view_carousel" className="text-[24px]" />
      </span>
      <p className="mt-3 text-sm font-semibold text-neutral-950">
        {filtered ? "No slides match" : "No hero slides yet"}
      </p>
      <p className="mt-1 text-sm text-neutral-500">
        {filtered ? "Try another filter or clear the search." : "Add a slide to show it at the top of the home page."}
      </p>
      {filtered ? null : (
        <Link
          href="/admin/home/hero/new"
          className="mt-4 inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/80"
        >
          New slide
        </Link>
      )}
    </div>
  );
}

export default function AdminHomeHeroPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <HeroSlidesView />
    </Suspense>
  );
}

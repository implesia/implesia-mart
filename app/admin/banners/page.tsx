"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { useBanners } from "@/lib/mart-mock/hooks";
import type { AdminBanner } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import { AdminLoading } from "../_components/admin-ui";

type PublishFilter = "all" | "live" | "off";

function isFilter(
  value: string | null,
): value is Exclude<PublishFilter, "all"> {
  return value === "live" || value === "off";
}

function bannersHref(filter: PublishFilter) {
  if (filter === "all") return "/admin/banners";
  return `/admin/banners?status=${filter}`;
}

function BannersView() {
  const params = useSearchParams();
  const raw = params.get("status");
  const filter: PublishFilter = isFilter(raw) ? raw : "all";
  const banners = useBanners();
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => ({
      all: banners.length,
      live: banners.filter((banner) => banner.published).length,
      off: banners.filter((banner) => !banner.published).length,
    }),
    [banners],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return banners
      .map((banner, index) => ({ banner, position: index + 1 }))
      .filter(({ banner }) => {
        if (filter === "live" && !banner.published) return false;
        if (filter === "off" && banner.published) return false;
        if (!needle) return true;
        return [banner.title, banner.priceLabel, banner.imageSrc]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      });
  }, [banners, filter, query]);

  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
      <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-950">
            {query.trim()
              ? `${visible.length}টি মিলেছে`
              : `${visible.length}টি স্লাইড`}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            হোম হিরোর স্লাইড। লেআউট এই ধাপে বদলায় না, কার্ড খুললে লেখা ও ছবি
            এডিট হয়।
          </p>
        </div>
        <label className="relative block w-full lg:w-80">
          <MaterialIcon
            name="search"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-neutral-400"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="শিরোনাম, দাম বা ছবির পাথ"
            aria-label="ব্যানার খুঁজুন"
            className="h-10 w-full rounded-xl border border-neutral-200 bg-[#f5f6f8] pr-3 pl-10 text-sm text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-primary focus:ring-3 focus:ring-primary/25"
          />
        </label>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-neutral-100 px-2">
        <FilterTab
          href={bannersHref("all")}
          label="সব"
          count={counts.all}
          active={filter === "all"}
        />
        <FilterTab
          href={bannersHref("live")}
          label="প্রকাশিত"
          count={counts.live}
          active={filter === "live"}
        />
        <FilterTab
          href={bannersHref("off")}
          label="বন্ধ"
          count={counts.off}
          active={filter === "off"}
        />
      </div>

      {visible.length === 0 ? (
        <p className="px-5 py-16 text-center text-sm text-neutral-500">
          {query.trim()
            ? "এই খোঁজে কোনো স্লাইড নেই।"
            : "এই ফিল্টারে কোনো স্লাইড নেই।"}
        </p>
      ) : (
        <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">
          {visible.map(({ banner, position }) => (
            <BannerCard key={banner.id} banner={banner} position={position} />
          ))}
        </div>
      )}
    </section>
  );
}

function FilterTab({
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
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-medium",
        active ? "text-neutral-950" : "text-neutral-500 hover:text-neutral-800",
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
          active
            ? "bg-primary/10 text-primary"
            : "bg-neutral-100 text-neutral-500",
        )}
      >
        {count}
      </span>
      {active ? (
        <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />
      ) : null}
    </Link>
  );
}

function BannerCard({
  banner,
  position,
}: {
  banner: AdminBanner;
  position: number;
}) {
  return (
    <Link
      href={`/admin/banners/${banner.id}`}
      className="group overflow-hidden rounded-2xl ring-1 ring-neutral-200 transition-colors hover:ring-neutral-300"
    >
      <span className="relative block aspect-16/8 overflow-hidden bg-neutral-100">
        <Image
          src={banner.imageSrc}
          alt=""
          fill
          sizes="(min-width: 1280px) 40vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-neutral-950">
          স্লাইড {position}
        </span>
        <span
          className={cn(
            "absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-semibold",
            banner.published
              ? "bg-emerald-50 text-emerald-700"
              : "bg-white/95 text-neutral-600",
          )}
        >
          {banner.published ? "প্রকাশিত" : "বন্ধ"}
        </span>
      </span>
      <span className="flex items-end justify-between gap-3 px-4 py-3.5">
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-neutral-950">
            {banner.title}
          </span>
          <span className="mt-1 block truncate text-xs text-neutral-400">
            {banner.imageSrc}
          </span>
        </span>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-neutral-950">
          {banner.priceLabel}
        </span>
      </span>
    </Link>
  );
}

export default function AdminBannersPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <BannersView />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { readBanners, saveBanner, type AdminBanner } from "@/lib/mart-mock/store";

import {
  AdminCard,
  AdminLoading,
  AdminPageHeader,
  adminFieldClass,
  FieldLabel,
} from "../../_components/admin-ui";

export default function EditBannerPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id ?? "");
  const router = useRouter();
  const [banner, setBanner] = useState<AdminBanner | null | undefined>(undefined);

  useEffect(() => {
    setBanner(readBanners().find((item) => item.id === id) ?? null);
  }, [id]);

  if (banner === undefined) return <AdminLoading />;

  if (!banner) {
    return (
      <>
        <AdminPageHeader title="স্লাইড পাওয়া যায়নি" />
        <Link href="/admin/banners" className="text-sm font-medium text-primary">
          ব্যানার লিস্টে ফিরুন
        </Link>
      </>
    );
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    if (!banner) return;
    saveBanner(banner);
    router.push("/admin/banners");
  }

  return (
    <>
      <AdminPageHeader title="ব্যানার এডিট" description="শিরোনাম, দাম, ছবির পাথ, প্রকাশিত।" />
      <AdminCard>
        <form onSubmit={save} className="flex flex-col gap-4">
          <div>
            <FieldLabel htmlFor="banner-title">শিরোনাম</FieldLabel>
            <input
              id="banner-title"
              value={banner.title}
              onChange={(event) => setBanner({ ...banner, title: event.target.value })}
              className={adminFieldClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor="banner-price">দাম</FieldLabel>
            <input
              id="banner-price"
              value={banner.priceLabel}
              onChange={(event) => setBanner({ ...banner, priceLabel: event.target.value })}
              className={adminFieldClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor="banner-image">ছবির পাথ</FieldLabel>
            <input
              id="banner-image"
              value={banner.imageSrc}
              onChange={(event) => setBanner({ ...banner, imageSrc: event.target.value })}
              className={adminFieldClass}
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f5f6f8] px-3.5 py-3">
            <span className="text-sm font-medium text-neutral-800">প্রকাশিত</span>
            <button
              type="button"
              role="switch"
              aria-checked={banner.published}
              onClick={() => setBanner({ ...banner, published: !banner.published })}
              className={cn(
                "relative h-6 w-11 rounded-full",
                banner.published ? "bg-primary" : "bg-neutral-300",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-white",
                  banner.published ? "left-5" : "left-0.5",
                )}
              />
            </button>
          </div>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/80"
          >
            সেভ
          </button>
        </form>
      </AdminCard>
    </>
  );
}

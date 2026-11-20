"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { MaterialIcon } from "../../_components/common/material-icon";
import type {
  ProductDetail,
  ProductSpecGroupId,
  ProductSpecItem,
} from "../../_data/products/product-details";

const GADGET_GROUP_META: Record<
  ProductSpecGroupId,
  { title: string; subtitle: string; icon: string; order: number }
> = {
  power: { title: "পাওয়ার ও ব্যাটারি", subtitle: "Battery & Charging", icon: "battery_charging_full", order: 1 },
  connectivity: { title: "কানেকটিভিটি", subtitle: "Wireless & Ports", icon: "bluetooth", order: 2 },
  features: { title: "মূল ফিচার", subtitle: "Core Capabilities", icon: "tune", order: 3 },
  build: { title: "বিল্ড ও উপকরণ", subtitle: "Material & Durability", icon: "construction", order: 4 },
  dimensions: { title: "মাত্রা ও ওজন", subtitle: "Size, Weight & Fit", icon: "straighten", order: 5 },
  fabric: { title: "ফেব্রিক ও উপাদান", subtitle: "Fabric & Material", icon: "texture", order: 6 },
  construction: { title: "সেলাই ও ফিনিশিং", subtitle: "Tailoring & Craftsmanship", icon: "content_cut", order: 7 },
  sizing: { title: "সাইজ ও ফিটিং", subtitle: "Sizing & Measurements", icon: "straighten", order: 8 },
  customization: { title: "কাস্টমাইজেশন", subtitle: "Personalization", icon: "design_services", order: 9 },
  care: { title: "যত্ন ও পরিচালনা", subtitle: "Care & Maintenance", icon: "local_laundry_service", order: 10 },
  timeline: { title: "ডেলিভারি ও সময়", subtitle: "Timeline & Delivery", icon: "schedule", order: 11 },
  general: { title: "অন্যান্য স্পেসিফিকেশন", subtitle: "General Specs", icon: "info", order: 12 },
};

const FASHION_GROUP_META: Record<
  ProductSpecGroupId,
  { title: string; subtitle: string; icon: string; order: number }
> = {
  fabric: { title: "ফেব্রিক ও উপাদান", subtitle: "Fabric & Material", icon: "texture", order: 1 },
  construction: { title: "সেলাই ও কারুকাজ", subtitle: "Craftsmanship & Finish", icon: "content_cut", order: 2 },
  sizing: { title: "সাইজ ও মেজারমেন্ট", subtitle: "Sizing & Fit", icon: "straighten", order: 3 },
  customization: { title: "কাস্টমাইজেশন অপশন", subtitle: "Custom Personalization", icon: "design_services", order: 4 },
  care: { title: "যত্ন ও সংরক্ষণ", subtitle: "Wash & Preservation", icon: "local_laundry_service", order: 5 },
  timeline: { title: "তৈরি ও ডেলিভারি", subtitle: "Crafting & Delivery", icon: "schedule", order: 6 },
  power: { title: "পাওয়ার", subtitle: "Power Specs", icon: "battery_charging_full", order: 7 },
  connectivity: { title: "কানেকশন", subtitle: "Connectivity", icon: "bluetooth", order: 8 },
  features: { title: "মূল ফিচার", subtitle: "Features", icon: "star", order: 9 },
  build: { title: "বিল্ড ও গঠন", subtitle: "Structure", icon: "construction", order: 10 },
  dimensions: { title: "পরিমাপ", subtitle: "Dimensions", icon: "straighten", order: 11 },
  general: { title: "অন্যান্য তথ্য", subtitle: "Other Details", icon: "info", order: 12 },
};

function groupSpecs(
  items: ProductSpecItem[],
  categoryId: ProductDetail["categoryId"],
) {
  const meta = categoryId === "fashion" ? FASHION_GROUP_META : GADGET_GROUP_META;
  const buckets = new Map<ProductSpecGroupId, ProductSpecItem[]>();

  for (const item of items) {
    const key = item.group ?? "general";
    const list = buckets.get(key) ?? [];
    list.push(item);
    buckets.set(key, list);
  }

  return [...buckets.entries()]
    .map(([id, groupItems]) => ({
      id,
      ...meta[id],
      items: groupItems,
    }))
    .sort((a, b) => a.order - b.order);
}

export function ProductSpecifications({ product }: { product: ProductDetail }) {
  const isFashion = product.categoryId === "fashion";
  const whatsInBox = product.whatsInBox ?? [];
  const materialDetails = product.materialDetails ?? [];
  const sections = useMemo(
    () => groupSpecs(materialDetails, product.categoryId),
    [materialDetails, product.categoryId],
  );

  const [activeFilter, setActiveFilter] = useState<string>("all");

  const packageTitle = isFashion ? "প্যাকেজে যা যা পাবেন" : "বক্সের ভেতরের সামগ্রী";
  const packageSubtitle = isFashion ? "Package Contents & Accessories" : "What's in the Box";
  const packageIcon = isFashion ? "checkroom" : "inventory_2";
  const heading = isFashion
    ? "ফেব্রিক, কারুকাজ ও স্পেসিফিকেশন"
    : "টেকনিক্যাল স্পেসিফিকেশন ও ডিটেইলস";
  const intro = isFashion
    ? "প্রতিটি গাউনের ফেব্রিক কোয়ালিটি, সেলাইয়ের গভীরতা, কাস্টম মাপ ও যত্ন নির্দেশনা — নিখুঁত জেনে অর্ডার করুন।"
    : "পাওয়ার, কানেক্টিভিটি, ম্যাটেরিয়াল ও পারফরম্যান্স — এক নজরে সব টেকনিক্যাল তথ্য।";

  const totalSpecsCount = materialDetails.length;

  const filteredSections = useMemo(() => {
    if (activeFilter === "all") return sections;
    return sections.filter((s) => s.id === activeFilter);
  }, [sections, activeFilter]);

  if (!whatsInBox.length && !sections.length) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-low px-6 py-12 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MaterialIcon name="tune" className="text-[24px]" />
        </div>
        <h4 className="text-base font-semibold text-on-surface">স্পেসিফিকেশন প্রক্রিয়াধীন</h4>
        <p className="mt-1 text-sm text-on-surface-variant">
          এই প্রোডাক্টের পূর্ণাঙ্গ স্পেসিফিকেশন ডেটাশীট শীঘ্রই যুক্ত হবে।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Header with Stats Badges */}
      <header className="rounded-2xl border border-outline-variant/20 bg-linear-to-r from-surface-container-low via-surface-container-low/60 to-surface-container-lowest p-5 sm:p-6 dark:border-white/10 dark:from-surface-container/60 dark:to-surface-container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase">
              <MaterialIcon name="verified" className="text-[14px]" />
              <span>Verified Specifications</span>
            </div>
            <h3 className="font-headline-sm text-on-background">{heading}</h3>
            <p className="mt-1.5 max-w-2xl text-body-md text-on-surface-variant">
              {intro}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-3.5 py-2 shadow-xs dark:border-white/10 dark:bg-surface-container-highest">
              <MaterialIcon name="format_list_bulleted" className="text-[18px] text-primary" />
              <div className="text-left">
                <span className="block text-xs text-on-surface-variant">মোট স্পেক</span>
                <span className="text-sm font-bold text-on-surface">{totalSpecsCount} টি প্যারামিটার</span>
              </div>
            </div>
            {whatsInBox.length ? (
              <div className="flex items-center gap-2 rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-3.5 py-2 shadow-xs dark:border-white/10 dark:bg-surface-container-highest">
                <MaterialIcon name="inventory_2" className="text-[18px] text-secondary" />
                <div className="text-left">
                  <span className="block text-xs text-on-surface-variant">প্যাকেজ আইটেম</span>
                  <span className="text-sm font-bold text-on-surface">{whatsInBox.length} টি সামগ্রী</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Package Items / What's In The Box */}
      {whatsInBox.length ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
                <MaterialIcon name={packageIcon} className="text-[20px]" />
              </span>
              <div>
                <h4 className="font-label-md text-on-surface sm:text-base font-bold">
                  {packageTitle}
                </h4>
                <p className="text-xs text-on-surface-variant">{packageSubtitle}</p>
              </div>
            </div>
            <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-xs font-medium text-on-surface-variant">
              {whatsInBox.length} Items Included
            </span>
          </div>

          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {whatsInBox.map((item, idx) => (
              <li
                key={item}
                className={cn(
                  "group relative flex items-start gap-3 rounded-xl border border-outline-variant/25",
                  "bg-surface-container-lowest p-3.5 text-body-md text-on-surface shadow-xs transition-all duration-200",
                  "hover:border-primary/40 hover:shadow-sm dark:border-white/10 dark:bg-surface-container",
                )}
              >
                <span className="mt-0.5 flex size-6.5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary ring-2 ring-primary/10 transition-colors group-hover:bg-primary group-hover:text-white">
                  <MaterialIcon name="check" className="text-[15px] font-bold" />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block text-[11px] font-semibold text-primary uppercase tracking-wider">
                    আইটেম #{idx + 1}
                  </span>
                  <span className="mt-0.5 block text-sm font-medium leading-snug text-on-surface">
                    {item}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Grouped Specifications */}
      {sections.length ? (
        <section className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
                <MaterialIcon
                  name={isFashion ? "style" : "settings_input_component"}
                  className="text-[20px]"
                />
              </span>
              <div>
                <h4 className="font-label-md text-on-surface sm:text-base font-bold">
                  {isFashion ? "বিস্তারিত স্পেক ও মেটেরিয়াল" : "টেকনিক্যাল স্পেসিফিকেশন ক্যাটাগরি"}
                </h4>
                <p className="text-xs text-on-surface-variant">
                  ক্যাটাগরি অনুযায়ী সাজানো পূর্ণাঙ্গ বিবরণ
                </p>
              </div>
            </div>

            {/* Category Filter Pills for Quick Navigation */}
            {sections.length > 2 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={cn(
                    "cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-all",
                    activeFilter === "all"
                      ? "bg-primary text-white shadow-xs"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
                  )}
                >
                  সব ({totalSpecsCount})
                </button>
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveFilter(sec.id)}
                    className={cn(
                      "cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-all",
                      activeFilter === sec.id
                        ? "bg-primary text-white shadow-xs"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/20 dark:border-white/10",
                    )}
                  >
                    {sec.title}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
            {filteredSections.map((section) => (
              <article
                key={section.id}
                className={cn(
                  "flex flex-col overflow-hidden rounded-2xl border border-outline-variant/30",
                  "bg-surface-container-lowest shadow-xs transition-shadow duration-200 hover:shadow-sm",
                  "dark:border-white/10 dark:bg-surface-container",
                )}
              >
                {/* Section Header */}
                <div className="flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-low/70 px-4 py-3 sm:px-5 dark:border-white/10 dark:bg-background/40">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7.5 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MaterialIcon name={section.icon} className="text-[18px]" />
                    </span>
                    <div>
                      <h5 className="text-sm font-bold text-on-surface">{section.title}</h5>
                      <span className="block text-[11px] font-normal text-on-surface-variant">
                        {section.subtitle}
                      </span>
                    </div>
                  </div>
                  <span className="rounded-md border border-outline-variant/20 bg-surface-container-lowest px-2 py-0.5 text-[11px] font-semibold text-outline-variant text-on-surface-variant dark:border-white/10 dark:bg-surface-container-high">
                    {section.items.length} তথ্য
                  </span>
                </div>

                {/* Section Specs Table */}
                <dl className="flex-1 divide-y divide-outline-variant/15 dark:divide-white/10">
                  {section.items.map((item, idx) => (
                    <div
                      key={`${section.id}-${item.label}-${idx}`}
                      className={cn(
                        "grid grid-cols-1 gap-1 px-4 py-3 transition-colors sm:grid-cols-[minmax(8rem,40%)_1fr] sm:items-start sm:gap-4 sm:px-5",
                        idx % 2 === 1 ? "bg-surface-container-low/30 dark:bg-white/[0.015]" : "",
                        "hover:bg-primary/[0.03]",
                      )}
                    >
                      <dt className="text-xs font-semibold text-on-surface-variant/90 sm:pt-0.5">
                        {item.label}
                      </dt>
                      <dd className="text-sm font-medium leading-relaxed text-on-surface">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* Fashion / Custom Tailoring Assurance Card */}
      {isFashion ? (
        <aside
          className={cn(
            "relative overflow-hidden rounded-2xl border border-primary/25 bg-linear-to-br from-primary/8 via-primary/4 to-transparent",
            "p-5 sm:p-6 dark:border-primary/30 dark:from-primary/15 dark:to-transparent",
          )}
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
                <MaterialIcon name="handyman" className="text-[14px]" />
                <span>Bespoke Tailoring Guarantee</span>
              </div>
              <h4 className="text-base font-bold text-on-background sm:text-lg">
                ১০০% কাস্টম ফিটিং ও ফ্রি অলটারেশন সুবিধা
              </h4>
              <p className="max-w-2xl text-sm leading-relaxed text-on-surface-variant">
                অর্ডারের পর আমাদের এক্সপার্ট মাস্টার আপনার সাথে যোগাযোগ করে সঠিক মেজারমেন্ট গাইড করবেন। প্রতিটি গাউনে ভেতরে ১.৫–২ ইঞ্চি মার্জিন রাখা থাকে এবং ডেলিভারির পর যেকোনো ফিটিং সমন্বয় সম্পূর্ণ বিনামূল্যে করা হয়।
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
              <a
                href="https://wa.me/8801700000000?text=Hello%2C%20I%20have%20questions%20about%20custom%20gown%20measurements"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700 hover:shadow-md sm:text-sm"
              >
                <MaterialIcon name="chat" className="text-[18px]" />
                <span>WhatsApp কনসাল্টেশন</span>
              </a>
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  );
}

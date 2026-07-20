"use client";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import type {
  ProductDetail,
  ProductSpecGroupId,
  ProductSpecItem,
} from "../../_data/products/product-details";

const GADGET_GROUP_META: Record<
  ProductSpecGroupId,
  { title: string; icon: string; order: number }
> = {
  power: { title: "পাওয়ার ও ব্যাটারি", icon: "battery_charging_full", order: 1 },
  connectivity: { title: "কানেকটিভিটি", icon: "bluetooth", order: 2 },
  features: { title: "মূল ফিচার", icon: "tune", order: 3 },
  build: { title: "বিল্ড ও উপকরণ", icon: "construction", order: 4 },
  dimensions: { title: "মাত্রা ও কম্প্যাটিবিলিটি", icon: "straighten", order: 5 },
  fabric: { title: "ফেব্রিক", icon: "texture", order: 6 },
  construction: { title: "নির্মাণ", icon: "handyman", order: 7 },
  sizing: { title: "সাইজ", icon: "straighten", order: 8 },
  customization: { title: "কাস্টম", icon: "design_services", order: 9 },
  care: { title: "কেয়ার", icon: "local_laundry_service", order: 10 },
  timeline: { title: "ডেলিভারি", icon: "schedule", order: 11 },
  general: { title: "অন্যান্য তথ্য", icon: "info", order: 12 },
};

const FASHION_GROUP_META: Record<
  ProductSpecGroupId,
  { title: string; icon: string; order: number }
> = {
  fabric: { title: "ফেব্রিক ও উপকরণ", icon: "texture", order: 1 },
  construction: { title: "সেলাই ও ফিনিশিং", icon: "content_cut", order: 2 },
  sizing: { title: "সাইজ ও ফিটিং", icon: "straighten", order: 3 },
  customization: { title: "কাস্টমাইজেশন", icon: "design_services", order: 4 },
  care: { title: "যত্ন নির্দেশনা", icon: "local_laundry_service", order: 5 },
  timeline: { title: "তৈরির সময়", icon: "schedule", order: 6 },
  power: { title: "পাওয়ার", icon: "battery_charging_full", order: 7 },
  connectivity: { title: "কানেকশন", icon: "bluetooth", order: 8 },
  features: { title: "ফিচার", icon: "star", order: 9 },
  build: { title: "বিল্ড", icon: "construction", order: 10 },
  dimensions: { title: "মাত্রা", icon: "straighten", order: 11 },
  general: { title: "অন্যান্য তথ্য", icon: "info", order: 12 },
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
  const sections = groupSpecs(materialDetails, product.categoryId);

  const packageTitle = isFashion ? "প্যাকেজে যা পাবেন" : "বক্সে যা থাকবে";
  const packageIcon = isFashion ? "package_2" : "inventory_2";
  const heading = isFashion ? "ফেব্রিক ও প্রোডাক্ট স্পেক" : "টেকনিক্যাল স্পেসিফিকেশন";
  const intro = isFashion
    ? "ফেব্রিক, সাইজ, কাস্টম অপশন ও কেয়ার — অর্ডারের আগে যা জানা জরুরি।"
    : "পাওয়ার, কানেকশন, বিল্ড ও মূল ফিচার — এক নজরে সম্পূর্ণ স্পেক।";

  if (!whatsInBox.length && !sections.length) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-low px-6 py-10 text-center">
        <p className="text-body-md text-on-surface-variant">
          এই প্রোডাক্টের স্পেসিফিকেশন শীঘ্রই যুক্ত হবে।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <header className="max-w-2xl">
        <p className="mb-2 text-label-sm tracking-wide text-primary uppercase">
          স্পেসিফিকেশন
        </p>
        <h3 className="font-headline-sm text-on-background">{heading}</h3>
        <p className="mt-2 text-body-md text-on-surface-variant">{intro}</p>
      </header>

      {whatsInBox.length ? (
        <section>
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MaterialIcon name={packageIcon} className="text-[20px]" />
            </span>
            <h4 className="font-label-md text-on-surface sm:text-base">{packageTitle}</h4>
          </div>
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {whatsInBox.map((item) => (
              <li
                key={item}
                className={cn(
                  "flex items-start gap-3 rounded-xl border border-outline-variant/25",
                  "bg-surface-container-low px-4 py-3.5 text-body-md text-on-surface",
                  "dark:border-white/10 dark:bg-surface-container",
                )}
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <MaterialIcon name="check" className="text-[15px]" />
                </span>
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {sections.length ? (
        <section className="space-y-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MaterialIcon name={isFashion ? "checkroom" : "settings_input_component"} className="text-[20px]" />
            </span>
            <h4 className="font-label-md text-on-surface sm:text-base">
              {isFashion ? "বিস্তারিত স্পেক" : "টেকনিক্যাল ডিটেইলস"}
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
            {sections.map((section) => (
              <article
                key={section.id}
                className={cn(
                  "overflow-hidden rounded-2xl border border-outline-variant/30",
                  "bg-surface-container-lowest dark:border-white/10 dark:bg-surface-container",
                )}
              >
                <div className="flex items-center gap-2.5 border-b border-outline-variant/20 bg-surface-container-low/80 px-4 py-3 sm:px-5 dark:border-white/10 dark:bg-background/30">
                  <MaterialIcon name={section.icon} className="text-[18px] text-primary" />
                  <h5 className="text-sm font-semibold text-on-surface">{section.title}</h5>
                </div>
                <dl className="divide-y divide-outline-variant/15 dark:divide-white/10">
                  {section.items.map((item) => (
                    <div
                      key={`${section.id}-${item.label}`}
                      className="grid grid-cols-1 gap-1 px-4 py-3.5 sm:grid-cols-[minmax(7.5rem,38%)_1fr] sm:items-start sm:gap-4 sm:px-5"
                    >
                      <dt className="text-label-sm text-outline sm:pt-0.5">{item.label}</dt>
                      <dd className="text-sm font-medium leading-snug text-on-surface sm:text-[15px]">
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

      {isFashion ? (
        <aside
          className={cn(
            "rounded-2xl border border-primary/15 bg-primary/5 px-5 py-4 sm:px-6 sm:py-5",
            "dark:border-primary/25 dark:bg-primary/10",
          )}
        >
          <div className="flex gap-3">
            <MaterialIcon name="info" className="mt-0.5 shrink-0 text-[20px] text-primary" />
            <p className="text-body-md leading-relaxed text-on-surface-variant">
              কাস্টম অর্ডারে মাপ, কালার ও ডিজাইন কনফার্ম হওয়ার পর স্টিচিং শুরু হয়।
              সঠিক ফিটিংয়ের জন্য অর্ডারের পর হোয়াটসঅ্যাপে মেজারমেন্ট শেয়ার করুন।
            </p>
          </div>
        </aside>
      ) : null}
    </div>
  );
}

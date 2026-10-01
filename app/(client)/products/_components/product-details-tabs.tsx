"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import type { ProductDetail } from "../../_data/products/product-details";
import { ProductSpecifications } from "./product-specifications";

function Stars({ value }: { value: number }) {
  return (
    <div className="flex text-tertiary">
      {Array.from({ length: 5 }).map((_, i) => (
        <MaterialIcon
          key={i}
          name="star"
          filled={i < Math.round(value)}
          className="text-[18px]"
        />
      ))}
    </div>
  );
}

export function ProductDetailsTabs({ product }: { product: ProductDetail }) {
  const howToUse = product.howToUse ?? [];
  const suitableFor = product.suitableFor ?? [];
  const faqs = product.faqs ?? [];
  const reviews = product.reviews;
  const hasReviews = Boolean(reviews && reviews.items.length > 0);
  const [activeTab, setActiveTab] = useState("details");

  const tabs = [
    { value: "details", label: "বিস্তারিত", icon: "description" },
    { value: "specifications", label: "স্পেসিফিকেশন", icon: "tune" },
    ...(faqs.length
      ? [{ value: "faq", label: "প্রশ্নোত্তর", icon: "help" }]
      : []),
    { value: "reviews", label: "রিভিউ", icon: "rate_review" },
  ];

  const tabTriggerClass = cn(
    "relative z-10 h-auto! min-h-10 flex-1 cursor-pointer gap-1.5 rounded-lg border-transparent bg-transparent",
    "px-2 py-2.5 text-on-surface-variant shadow-none after:hidden",
    "justify-center transition-colors duration-300 ease-out",
    "hover:text-on-surface",
    "data-active:bg-transparent data-active:text-primary data-active:shadow-none",
    "dark:data-active:bg-transparent dark:data-active:text-primary",
    "sm:min-h-12 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-3",
    "md:min-h-14 md:gap-2.5 md:px-4 md:py-3.5",
  );

  return (
    <section className="mt-8 sm:mt-10 lg:mt-16">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="-mx-1 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList
            className={cn(
              "h-auto! w-full min-w-0 justify-stretch gap-1 rounded-xl",
              "group-data-horizontal/tabs:h-auto! group-data-horizontal/tabs:min-h-10",
              "border border-outline-variant/30 bg-surface-container-low p-1",
              "text-on-surface-variant sm:min-h-12 sm:gap-1.5 sm:rounded-2xl sm:p-1.5",
              "md:min-h-14 md:gap-2 md:p-2",
              "dark:border-white/10 dark:bg-surface-container",
            )}
          >
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={tabTriggerClass}
              >
                {activeTab === tab.value ? (
                  <motion.span
                    layoutId="pdp-tab-pill"
                    className="absolute inset-0 -z-10 rounded-lg bg-surface-container-lowest shadow-sm ring-1 ring-outline-variant/20 sm:rounded-xl dark:bg-surface-container-highest dark:ring-white/10"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  />
                ) : null}
                <MaterialIcon
                  name={tab.icon}
                  className={cn(
                    "hidden text-[18px] transition-colors duration-300 sm:inline",
                    activeTab === tab.value ? "text-primary" : "text-outline",
                  )}
                />
                <span className="whitespace-nowrap text-[11px] font-semibold sm:text-xs md:text-sm">
                  {tab.label}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <div
        className="pt-6 sm:pt-8 lg:pt-10"
        role="tabpanel"
        aria-label={tabs.find((t) => t.value === activeTab)?.label}
      >
        {" "}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeTab === "details" ? (
              <div className="grid grid-cols-1 gap-10 sm:gap-12 lg:grid-cols-2 lg:gap-16">
                <div className="space-y-8">
                  <div className="space-y-6">
                    <h3 className="font-headline-sm text-on-background">
                      {product.details.heading}
                    </h3>
                    <p className="text-body-lg text-on-surface-variant">
                      {product.details.body}
                    </p>
                    <ul className="space-y-3">
                      {product.details.bullets.map((b) => (
                        <li
                          key={b}
                          className="flex items-center gap-3 text-body-md text-on-surface"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {howToUse.length ? (
                    <div className="space-y-4">
                      <h4 className="font-headline-sm text-on-background">
                        কীভাবে ব্যবহার করবেন
                      </h4>
                      <ol className="space-y-3">
                        {howToUse.map((step, index) => (
                          <li
                            key={step}
                            className="flex items-start gap-3 text-body-md text-on-surface"
                          >
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-label-md text-primary">
                              {index + 1}
                            </span>
                            <span className="pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}

                  {suitableFor.length ? (
                    <div className="space-y-3">
                      <h4 className="font-headline-sm text-on-background">
                        কার জন্য উপযোগী
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {suitableFor.map((item) => (
                          <span
                            key={item}
                            className="rounded-full bg-surface-container px-3 py-1.5 text-label-sm text-on-surface-variant"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <aside className="relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-primary/15 bg-[#0a2e2b] text-white shadow-sm sm:rounded-2xl">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.12]"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 20% 20%, #2bc0b5 0%, transparent 45%), radial-gradient(circle at 80% 80%, #1a9e94 0%, transparent 40%)",
                    }}
                  />
                  <div className="relative z-10 flex flex-1 flex-col p-4 sm:p-6 lg:p-8">
                    <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 backdrop-blur-sm sm:mb-5 sm:px-3 sm:py-1.5">
                      <MaterialIcon
                        name="verified"
                        filled
                        className="text-[16px] text-primary sm:text-[18px]"
                      />
                      <span className="text-[11px] text-white/90 sm:text-label-sm">
                        ভেরিফাইড কোয়ালিটি
                      </span>
                    </div>

                    <h4 className="mb-2 text-lg font-medium text-white sm:mb-3 sm:text-xl">
                      {product.details.authenticity.title}
                    </h4>
                    <p className="mb-4 max-w-md text-sm leading-relaxed text-white/75 sm:mb-6 sm:text-base">
                      {product.details.authenticity.body}
                    </p>

                    <ul className="mt-auto space-y-2.5 sm:space-y-3">
                      {[
                        "ডেলিভারির আগে ফাংশনালিটি চেক",
                        "প্যাকেজিং ও অ্যাকসেসরিজ ভেরিফাই",
                        "ডিফেক্ট হলে সহজ সাপোর্ট",
                      ].map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-2.5 text-sm text-white/90 sm:gap-3 sm:text-base"
                        >
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary sm:size-7">
                            <MaterialIcon
                              name="check"
                              className="text-[14px] sm:text-[16px]"
                            />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {product.details.authenticity.imageSrc ? (
                    <div className="relative z-10 mx-4 mb-4 h-24 overflow-hidden rounded-lg border border-white/10 bg-black/25 sm:mx-6 sm:mb-6 sm:h-28 sm:rounded-xl lg:mx-8 lg:mb-8 lg:h-36">
                      <Image
                        src={product.details.authenticity.imageSrc}
                        alt={product.details.authenticity.imageAlt}
                        fill
                        className="object-cover object-center opacity-80"
                        sizes="(max-width: 1024px) 100vw, 40vw"
                      />
                      <div className="absolute inset-0 bg-linear-to-r from-[#0a2e2b]/90 via-[#0a2e2b]/35 to-[#0a2e2b]/70" />
                    </div>
                  ) : null}
                </aside>
              </div>
            ) : null}

            {activeTab === "specifications" ? (
              <ProductSpecifications product={product} />
            ) : null}

            {activeTab === "faq" && faqs.length ? (
              <div className="mx-auto max-w-3xl space-y-3 sm:space-y-4">
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-lg font-medium text-on-background sm:font-headline-sm">
                    সাধারণ জিজ্ঞাসা
                  </h3>
                  <p className="mt-1.5 text-sm text-on-surface-variant sm:mt-2 sm:text-base">
                    অর্ডার, ডেলিভারি, ব্যবহার ও কেয়ার — যে প্রশ্নগুলো বেশি আসে,
                    তার উত্তর।
                  </p>
                </div>
                {faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="group rounded-xl border border-outline-variant/30 bg-surface-container-low px-3.5 py-3.5 sm:rounded-2xl sm:px-5 sm:py-4"
                  >
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-sm font-semibold text-on-surface sm:items-center sm:gap-4 sm:text-base">
                      <span className="min-w-0 leading-snug">
                        {faq.question}
                      </span>
                      <MaterialIcon
                        name="expand_more"
                        className="mt-0.5 shrink-0 text-outline transition-transform duration-300 group-open:rotate-180"
                      />
                    </summary>
                    <p className="mt-2.5 text-sm leading-relaxed text-on-surface-variant sm:mt-3 sm:text-base">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            ) : null}

            {activeTab === "reviews" ? (
              !hasReviews || !reviews ? (
                <section className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-low p-6 sm:p-8 md:p-12">
                  <div className="mb-3 inline-flex items-center gap-2 text-primary">
                    <MaterialIcon name="rate_review" />
                    <span className="font-label-md tracking-widest uppercase">
                      রিভিউ
                    </span>
                  </div>
                  <h3 className="mb-3 text-xl font-medium text-on-background sm:font-headline-sm">
                    এখনও কোনো রিভিউ নেই
                  </h3>
                  <p className="max-w-2xl text-sm text-on-surface-variant sm:text-body-md">
                    {product.status === "coming-soon"
                      ? "প্রোডাক্ট লঞ্চ হওয়ার পর এখানে ভেরিফাইড কাস্টমার রিভিউ যুক্ত হবে।"
                      : "প্রথম রিভিউটি আপনার হতে পারে — অর্ডার করার পর আপনার অভিজ্ঞতা শেয়ার করুন।"}
                  </p>
                </section>
              ) : (
                <section className="pb-6 sm:pb-10">
                  <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h2 className="mb-2 font-headline-md text-xl sm:text-2xl lg:text-3xl">
                        কাস্টমার ফিডব্যাক
                      </h2>
                      <p className="text-sm text-on-surface-variant sm:text-base">
                        আমাদের কাস্টমারদের সত্যিকারের অভিজ্ঞতা।
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground sm:w-auto"
                    >
                      রিভিউ লিখুন
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3 lg:gap-10">
                    <div className="h-fit rounded-2xl border border-outline-variant/30 bg-card p-5 sm:p-6 lg:p-8">
                      <div className="mb-6 text-center sm:mb-8">
                        <span className="text-5xl font-bold leading-none text-on-background sm:text-6xl">
                          {reviews.average.toFixed(1)}
                        </span>
                        <div className="my-2 flex justify-center gap-1 text-tertiary">
                          <Stars value={reviews.average} />
                        </div>
                        <p className="text-label-sm text-outline">
                          {reviews.total} টি ভেরিফাইড রিভিউয়ের ভিত্তিতে
                        </p>
                      </div>

                      <div className="space-y-4">
                        {reviews.breakdown
                          .filter((b) => b.stars >= 3)
                          .map((b) => (
                            <div
                              key={b.stars}
                              className="flex items-center gap-3 sm:gap-4"
                            >
                              <span className="w-4 text-label-sm">
                                {b.stars}
                              </span>
                              <div className="flex-1">
                                <Progress value={b.percent} />
                              </div>
                              <span className="w-10 shrink-0 text-label-sm text-outline">
                                {b.percent}%
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="space-y-5 sm:space-y-6 lg:col-span-2 lg:space-y-8">
                      {reviews.items.map((r) => (
                        <div
                          key={r.id}
                          className="border-b border-outline-variant/30 pb-5 sm:p-6 sm:pb-6 lg:p-8"
                        >
                          <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4 sm:gap-6">
                            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-highest font-bold text-primary sm:h-12 sm:w-12">
                                {r.initials}
                              </div>
                              <div className="min-w-0">
                                <h5 className="truncate font-label-md text-on-surface">
                                  {r.name}
                                </h5>
                                <p className="text-label-sm text-outline">
                                  {r.meta}
                                </p>
                              </div>
                            </div>
                            <Stars value={r.rating} />
                          </div>
                          <p className="text-sm leading-relaxed text-on-surface-variant italic sm:text-base">
                            &ldquo;{r.quote}&rdquo;
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { MaterialIcon } from "../../_components/common/material-icon";
import type { ProductDetail } from "../../_data/products/product-details";

function Stars({ value }: { value: number }) {
  return (
    <div className="flex text-tertiary">
      {Array.from({ length: 5 }).map((_, i) => (
        <MaterialIcon key={i} name="star" filled={i < Math.round(value)} className="text-[18px]" />
      ))}
    </div>
  );
}

export function ProductDetailsTabs({ product }: { product: ProductDetail }) {
  const materialDetails = product.materialDetails ?? [];
  const reviews = product.reviews;
  const hasReviews = Boolean(reviews && reviews.items.length > 0);

  return (
    <section className="mt-xl">
      <Tabs defaultValue="details">
        <TabsList
          variant="line"
          className="w-full justify-start rounded-none border-b border-outline-variant/30 p-0 text-outline"
        >
          <TabsTrigger
            value="details"
            className="px-8 py-4 font-label-md data-active:text-primary data-active:after:bg-primary"
          >
            বিস্তারিত
          </TabsTrigger>
          <TabsTrigger
            value="specifications"
            className="px-8 py-4 font-label-md data-active:text-primary data-active:after:bg-primary"
          >
            স্পেসিফিকেশন
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="px-8 py-4 font-label-md data-active:text-primary data-active:after:bg-primary"
          >
            রিভিউ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="pt-10">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
            <div className="space-y-6">
              <h3 className="font-headline-sm text-on-background">{product.details.heading}</h3>
              <p className="text-body-lg text-on-surface-variant">{product.details.body}</p>
              <ul className="space-y-3">
                {product.details.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-body-md text-on-surface">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative flex items-center justify-center overflow-hidden rounded-2xl bg-surface-container p-10">
              <div className="relative z-10 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                  <MaterialIcon name="verified" className="text-3xl text-white" />
                </div>
                <h4 className="mb-2 font-headline-sm text-white drop-shadow-md">
                  {product.details.authenticity.title}
                </h4>
                <p className="mx-auto max-w-[300px] text-white/80 drop-shadow-sm">
                  {product.details.authenticity.body}
                </p>
              </div>

              <div className="absolute inset-0 bg-linear-to-br from-primary-container to-primary opacity-90" />
              <Image
                src={product.details.authenticity.imageSrc}
                alt={product.details.authenticity.imageAlt}
                fill
                className="absolute inset-0 object-cover mix-blend-overlay opacity-30"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="specifications" className="pt-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {materialDetails.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-6"
              >
                <p className="text-label-sm text-outline">{item.label}</p>
                <p className="mt-1 font-label-md text-on-surface">{item.value}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="pt-10">
          {!hasReviews || !reviews ? (
            <section className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-low p-8 md:p-12">
              <div className="mb-3 inline-flex items-center gap-2 text-primary">
                <MaterialIcon name="rate_review" />
                <span className="font-label-md tracking-widest uppercase">রিভিউ</span>
              </div>
              <h3 className="mb-3 font-headline-sm text-on-background">
                এখনও কোনো রিভিউ নেই
              </h3>
              <p className="max-w-xl text-body-md text-on-surface-variant">
                {product.status === "coming-soon"
                  ? "প্রোডাক্ট লঞ্চ হওয়ার পর এখানে ভেরিফাইড কাস্টমার রিভিউ যুক্ত হবে।"
                  : "প্রথম রিভিউটি আপনার হতে পারে — অর্ডার করার পর আপনার অভিজ্ঞতা শেয়ার করুন।"}
              </p>
            </section>
          ) : (
            <section className="pb-10">
              <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="mb-2 font-headline-md">কাস্টমার ফিডব্যাক</h2>
                  <p className="text-on-surface-variant">
                    আমাদের কাস্টমারদের সত্যিকারের অভিজ্ঞতা।
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  রিভিউ লিখুন
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
                <div className="h-fit rounded-2xl border border-outline-variant/30 bg-card p-8">
                  <div className="mb-8 text-center">
                    <span className="text-[64px] font-bold leading-none text-on-background">
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
                        <div key={b.stars} className="flex items-center gap-4">
                          <span className="w-4 text-label-sm">{b.stars}</span>
                          <div className="flex-1">
                            <Progress value={b.percent} />
                          </div>
                          <span className="w-10 text-label-sm text-outline">{b.percent}%</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="space-y-8 lg:col-span-2">
                  {reviews.items.map((r) => (
                    <div key={r.id} className="border-b border-outline-variant/30 p-8">
                      <div className="mb-4 flex items-start justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-highest font-bold text-primary">
                            {r.initials}
                          </div>
                          <div>
                            <h5 className="font-label-md text-on-surface">{r.name}</h5>
                            <p className="text-label-sm text-outline">{r.meta}</p>
                          </div>
                        </div>
                        <Stars value={r.rating} />
                      </div>
                      <p className="text-body-md text-on-surface-variant italic">
                        &ldquo;{r.quote}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}

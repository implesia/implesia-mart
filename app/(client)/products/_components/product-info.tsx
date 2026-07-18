"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import type { ProductDetail } from "../../_data/products/product-details";
import { useCart } from "../../_providers/cart-provider";

function formatPrice(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

const TRUST_BADGES = [
  { icon: "payments", label: "ক্যাশ অন ডেলিভারি" },
  { icon: "local_shipping", label: "সারাদেশে ডেলিভারি" },
  { icon: "assignment_return", label: "৩ দিন ইজি রিটার্ন" },
  { icon: "verified", label: "১০০% কোয়ালিটি চেকড" },
];

export function ProductInfo({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const isComingSoon = product.status === "coming-soon";

  function handleAddToCart() {
    const ok = addItem(product.slug, quantity, { openDrawer: true });
    if (!ok) return;
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  }

  function handleBuyNow() {
    const ok = addItem(product.slug, quantity, { openDrawer: false });
    if (!ok) return;
    router.push("/checkout");
  }

  const discountPct =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100,
        )
      : null;

  return (
    <div id="buy-box" className="flex flex-col">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-label-md tracking-[0.2em] text-primary uppercase">
          {product.tagline}
        </span>
        {product.rating ? (
          <div className="flex items-center gap-1 text-tertiary">
            <MaterialIcon name="star" filled className="text-sm" />
            <span className="text-label-sm text-outline">
              {product.rating.value.toFixed(1)} ({product.rating.count} রিভিউ)
            </span>
          </div>
        ) : null}
      </div>

      <h1 className="mb-4 font-display-lg text-on-background">{product.title}</h1>

      <p className="mb-6 text-body-md leading-relaxed text-on-surface-variant">
        {product.description}
      </p>

      <div className="mb-6 flex flex-wrap items-baseline gap-3">
        <span className="font-headline-md text-on-background">
          {formatPrice(product.price)}
        </span>
        {product.compareAtPrice ? (
          <>
            <span className="text-lg text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
            {discountPct ? (
              <span className="text-sm font-bold text-red-500">-{discountPct}%</span>
            ) : null}
          </>
        ) : null}
        <span className="rounded-full bg-surface-container px-3 py-1 font-label-md text-outline">
          {isComingSoon ? "প্রত্যাশিত মূল্য" : product.stockLabel}
        </span>
      </div>

      {product.keyFeatures?.length ? (
        <ul className="mb-6 space-y-3">
          {product.keyFeatures.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-body-md text-on-surface">
              <MaterialIcon
                name="check_circle"
                filled
                className="mt-0.5 shrink-0 text-[18px] text-primary"
              />
              {feature}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-x-6 gap-y-3 rounded-2xl bg-surface-container-low p-4">
        {TRUST_BADGES.map((badge) => (
          <div
            key={badge.label}
            className="flex items-center gap-2 text-sm text-on-surface-variant"
          >
            <MaterialIcon name={badge.icon} className="text-[20px] text-primary" />
            {badge.label}
          </div>
        ))}
      </div>

      {product.materialDetails?.length ? (
        <div className="mb-8">
          <label className="mb-4 block font-label-md text-on-background">স্পেসিফিকেশন</label>
          <div className="grid grid-cols-2 gap-4">
            {product.materialDetails.slice(0, 4).map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4"
              >
                <span className="mb-1 block text-label-sm text-outline">{item.label}</span>
                <span className="font-label-md text-on-surface">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {product.suitableFor?.length ? (
        <div className="mb-8">
          <label className="mb-3 block font-label-md text-on-background">কার জন্য উপযোগী</label>
          <div className="flex flex-wrap gap-2">
            {product.suitableFor.map((item) => (
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

      {isComingSoon ? (
        <div className="mb-8 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <MaterialIcon name="hourglass_top" />
            <span className="font-label-md tracking-widest uppercase">কামিং সুন</span>
          </div>
          <p className="mb-5 text-body-md text-on-surface-variant">
            এই প্রোডাক্টটি শীঘ্রই স্টকে আসছে। আগে থেকে জানতে বা প্রি-বুকিংয়ে আগ্রহী হলে আমাদের সাথে
            যোগাযোগ করুন।
          </p>
          <Link
            href="/contact-us"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-auto w-full rounded-full py-5 text-label-md shadow-xl",
            )}
          >
            <MaterialIcon name="chat" className="mr-2 text-[20px]" />
            মেসেজ করে জানুন
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-4">
            <label className="font-label-md text-on-background">পরিমাণ</label>
            <div className="inline-flex items-center rounded-full border border-outline-variant/40">
              <button
                type="button"
                className="flex size-10 items-center justify-center text-on-surface transition-colors hover:text-primary disabled:opacity-40"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="পরিমাণ কমান"
              >
                <MaterialIcon name="remove" className="text-[18px]" />
              </button>
              <span className="w-10 text-center font-label-md text-on-surface">{quantity}</span>
              <button
                type="button"
                className="flex size-10 items-center justify-center text-on-surface transition-colors hover:text-primary disabled:opacity-40"
                onClick={() => setQuantity((q) => Math.min(5, q + 1))}
                disabled={quantity >= 5}
                aria-label="পরিমাণ বাড়ান"
              >
                <MaterialIcon name="add" className="text-[18px]" />
              </button>
            </div>
          </div>

          <div className="mb-10 flex flex-col gap-4">
            <Button
              type="button"
              onClick={handleAddToCart}
              className="h-auto w-full rounded-full py-5 text-label-md shadow-xl hover:translate-y-[-2px] hover:shadow-2xl active:scale-95"
            >
              <MaterialIcon
                name={justAdded ? "check_circle" : "shopping_bag"}
                className="mr-2 text-[22px]"
              />
              {justAdded ? "কার্টে যোগ হয়েছে" : "কার্টে যুক্ত করুন"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleBuyNow}
              className="h-auto w-full rounded-full bg-warm-gold py-5 text-label-md text-white shadow-lg transition-all hover:translate-y-[-2px] hover:bg-warm-gold/95 hover:shadow-xl active:scale-95"
            >
              অর্ডার করুন
            </Button>
          </div>
        </>
      )}

      <Separator className="my-6 bg-outline-variant/30" />

      <div className="space-y-4">
        {product.delivery.map((d) => (
          <div key={d.title} className="flex items-start gap-4">
            <MaterialIcon name={d.icon} className="text-primary" />
            <div>
              <p className="font-label-md text-on-surface">{d.title}</p>
              <p className="text-label-sm text-outline">{d.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

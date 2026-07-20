import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import type { ProductDetail } from "../../_data/products/product-details";

type ProductSupportPanelProps = {
  product: ProductDetail;
  className?: string;
};

export function ProductSupportPanel({ product, className }: ProductSupportPanelProps) {
  const specs = product.materialDetails?.slice(0, 4) ?? [];
  const delivery = product.delivery ?? [];
  const isFashion = product.categoryId === "fashion";

  if (!specs.length && !delivery.length) return null;

  return (
    <div className={cn("space-y-5", className)}>
      {specs.length ? (
        <section
          className={cn(
            "rounded-2xl border border-outline-variant/35 bg-surface-container-lowest p-4 sm:p-5",
            "dark:border-white/10 dark:bg-surface-container",
          )}
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MaterialIcon name={isFashion ? "checkroom" : "tune"} className="text-[18px]" />
            </span>
            <h2 className="text-sm font-semibold text-on-surface sm:text-base">
              {isFashion ? "ফেব্রিক ও স্পেক" : "স্পেসিফিকেশন"}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {specs.map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-surface-container-low/90 px-3 py-3 dark:bg-background/35"
              >
                <p className="text-[11px] text-outline sm:text-label-sm">{item.label}</p>
                <p className="mt-1 text-xs font-semibold leading-snug text-on-surface sm:text-sm">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {delivery.length ? (
        <section
          className={cn(
            "rounded-2xl border border-outline-variant/35 bg-surface-container-lowest p-4 sm:p-5",
            "dark:border-white/10 dark:bg-surface-container",
          )}
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MaterialIcon name="verified_user" className="text-[18px]" />
            </span>
            <h2 className="text-sm font-semibold text-on-surface sm:text-base">
              অর্ডার ও ডেলিভারি তথ্য
            </h2>
          </div>
          <ul className="space-y-3.5">
            {delivery.map((item) => (
              <li key={item.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MaterialIcon name={item.icon} className="text-[18px]" />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-on-surface">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-on-surface-variant sm:text-sm">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

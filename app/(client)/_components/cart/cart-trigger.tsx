"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { formatCartMoney } from "../../_lib/cart-shared";
import { useCart } from "../../_providers/cart-provider";
import { MaterialIcon } from "../common/material-icon";

type CartTriggerProps = {
  className?: string;
  variant?: "icon" | "button" | "summary";
  onNavigate?: () => void;
};

export function CartTrigger({
  className,
  variant = "icon",
  onNavigate,
}: CartTriggerProps) {
  const { itemCount, hydrated, openCart, pricing } = useCart();
  const count = hydrated ? itemCount : 0;
  const totalLabel = formatCartMoney(hydrated ? pricing.subtotal : 0);

  if (variant === "summary") {
    return (
      <button
        type="button"
        className={cn(
          "flex min-h-11 min-w-11 items-center justify-center gap-2.5 rounded-md py-0.5 sm:pr-1 text-neutral-800 transition-colors hover:bg-neutral-100 hover:text-neutral-950",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950",
          className,
        )}
        aria-label={
          count > 0
            ? `আমার কার্ট, ${count}টি, ${totalLabel}`
            : `আমার কার্ট, ${totalLabel}`
        }
        onClick={openCart}
      >
        <span className="relative grid size-9 shrink-0 place-items-center">
          <MaterialIcon name="shopping_cart" className="text-[22px]" />
          <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-950 px-1 text-[10px] leading-none font-bold text-white ring-2 ring-white">
            {count > 99 ? "99+" : count}
          </span>
        </span>
        <span className="hidden min-w-[2.6rem] text-left leading-none sm:block">
          <span className="block text-[11px] font-medium text-neutral-500">
            আমার কার্ট
          </span>
          <span className="mt-1 block text-[13px] font-semibold tracking-tight text-neutral-950">
            {totalLabel}
          </span>
        </span>
        <MaterialIcon
          name="expand_more"
          className="hidden text-[18px] text-neutral-400 sm:inline"
        />
      </button>
    );
  }

  if (variant === "button") {
    return (
      <Button
        type="button"
        variant="outline"
        className={cn("h-11 rounded-full text-sm", className)}
        onClick={() => {
          onNavigate?.();
          openCart();
        }}
      >
        <MaterialIcon name="shopping_cart" className="mr-1.5 text-[18px]" />
        কার্ট
        {count > 0 ? (
          <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-bold text-primary-foreground">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "relative size-10 text-primary hover:bg-primary/5 hover:text-primary lg:size-11",
        className,
      )}
      aria-label={count > 0 ? `কার্ট, ${count}টি` : "কার্ট"}
      onClick={openCart}
    >
      <MaterialIcon
        name="shopping_cart"
        className="text-[22px] lg:text-[24px]"
      />
      {count > 0 ? (
        <span className="absolute top-1 right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-background">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Button>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useCart } from "../../_providers/cart-provider";
import { MaterialIcon } from "../common/material-icon";

type CartTriggerProps = {
  className?: string;
  variant?: "icon" | "button";
  onNavigate?: () => void;
};

export function CartTrigger({
  className,
  variant = "icon",
  onNavigate,
}: CartTriggerProps) {
  const { itemCount, hydrated, openCart } = useCart();
  const count = hydrated ? itemCount : 0;

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
      aria-label={count > 0 ? `শপিং কার্ট, ${count} টি আইটেম` : "শপিং কার্ট"}
      onClick={openCart}
    >
      <MaterialIcon name="shopping_cart" className="text-[22px] lg:text-[24px]" />
      {count > 0 ? (
        <span className="absolute top-1 right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-background">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Button>
  );
}

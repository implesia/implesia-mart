"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";

type CheckoutPaymentMethodProps = {
  className?: string;
};

export function CheckoutPaymentMethod({
  className,
}: CheckoutPaymentMethodProps) {
  const [method, setMethod] = useState<"online" | "cod">("online");

  return (
    <section className={cn(className)}>
      <Card className="border-border/60 bg-card/70 shadow-[0_8px_24px_rgba(0,0,0,0.04)] backdrop-blur-sm">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 font-headline-sm text-on-surface">
            <MaterialIcon name="payments" className="text-primary" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={method}
            onValueChange={(v) => setMethod(v as "online" | "cod")}
            className="gap-md"
          >
            <div
              className={cn(
                "rounded-xl border p-md transition-shadow",
                method === "online"
                  ? "border-primary bg-card shadow-[0_4px_12px_rgba(43,192,181,0.18)]"
                  : "border-border/60 bg-muted/20 hover:bg-card",
              )}
            >
              <label className="mb-md flex cursor-pointer items-center justify-between">
                <div className="flex items-center gap-sm">
                  <RadioGroupItem value="online" />
                  <span className="font-label-md text-on-surface">
                    Online Payment (Credit/Debit Card)
                  </span>
                </div>
                <div className="opacity-60">
                  <MaterialIcon name="credit_card" />
                </div>
              </label>

              {method === "online" ? (
                <div className="rounded-lg border border-border/60 bg-muted/20 p-md">
                  <div className="flex flex-col gap-xs">
                    <label className="text-[10px] font-bold tracking-widest text-outline uppercase">
                      Card Number
                    </label>
                    <div className="flex items-center gap-sm">
                      <Input
                        placeholder="xxxx xxxx xxxx xxxx"
                        className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                      />
                      <MaterialIcon
                        name="contactless"
                        className="text-slate-300"
                      />
                    </div>
                  </div>

                  <div className="mt-md grid grid-cols-2 gap-md border-t border-border/60 pt-md">
                    <div className="flex flex-col gap-xs">
                      <label className="text-[10px] font-bold tracking-widest text-outline uppercase">
                        Expiry
                      </label>
                      <Input
                        placeholder="MM / YY"
                        className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                      />
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className="text-[10px] font-bold tracking-widest text-outline uppercase">
                        CVC
                      </label>
                      <Input
                        placeholder="123"
                        className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div
              className={cn(
                "cursor-pointer rounded-xl border border-border/60 bg-muted/20 p-md transition-all hover:bg-card",
              )}
              onClick={() => setMethod("cod")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setMethod("cod");
              }}
            >
              <label className="flex cursor-pointer items-center gap-sm">
                <RadioGroupItem value="cod" />
                <span className="font-label-md text-on-surface-variant">
                  Cash on Delivery
                </span>
              </label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </section>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";

type CheckoutShippingFormProps = {
  className?: string;
};

export function CheckoutShippingForm({ className }: CheckoutShippingFormProps) {
  return (
    <section className={cn(className)}>
      <Card className="border-border/60 bg-card/70 shadow-[0_8px_24px_rgba(0,0,0,0.04)] backdrop-blur-sm">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 font-headline-sm text-on-surface">
            <MaterialIcon name="local_shipping" className="text-primary" />
            Shipping Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid grid-cols-1 gap-md md:grid-cols-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="flex flex-col gap-xs">
              <label className="text-[11px] font-semibold tracking-wide text-outline uppercase">
                Full Name
              </label>
              <Input
                placeholder="Johnathan Doe"
                className="h-11 rounded-lg bg-muted/40 ring-1 ring-foreground/10 focus-visible:ring-2"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-[11px] font-semibold tracking-wide text-outline uppercase">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="h-11 rounded-lg bg-muted/40 ring-1 ring-foreground/10 focus-visible:ring-2"
              />
            </div>

            <div className="flex flex-col gap-xs md:col-span-2">
              <label className="text-[11px] font-semibold tracking-wide text-outline uppercase">
                Street Address
              </label>
              <Input
                placeholder="123 Luxury Lane, Suite 450"
                className="h-11 rounded-lg bg-muted/40 ring-1 ring-foreground/10 focus-visible:ring-2"
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="text-[11px] font-semibold tracking-wide text-outline uppercase">
                City
              </label>
              <Input
                placeholder="New York"
                className="h-11 rounded-lg bg-muted/40 ring-1 ring-foreground/10 focus-visible:ring-2"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-[11px] font-semibold tracking-wide text-outline uppercase">
                Postal Code
              </label>
              <Input
                placeholder="10001"
                className="h-11 rounded-lg bg-muted/40 ring-1 ring-foreground/10 focus-visible:ring-2"
              />
            </div>

            <div className="flex flex-col gap-xs md:col-span-2">
              <label className="text-[11px] font-semibold tracking-wide text-outline uppercase">
                Order Notes (Optional)
              </label>
              <Textarea
                rows={3}
                placeholder="Special delivery instructions..."
                className="resize-none rounded-lg bg-muted/40 ring-1 ring-foreground/10 focus-visible:ring-2"
              />
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}


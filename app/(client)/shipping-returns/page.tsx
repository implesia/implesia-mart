import { MiniFaq } from "./_components/mini-faq";
import { PaymentMethods } from "./_components/payment-methods";
import { ReturnsPolicy } from "./_components/returns-policy";
import { ShippingHero } from "./_components/shipping-hero";
import { ShippingInfo } from "./_components/shipping-info";
import { ShippingSideNav } from "./_components/shipping-sidenav";
import { SupportCenter } from "./_components/support-center";

export default function ShippingReturnsPage() {
  return (
    <main className="pt-20">
      <ShippingHero />

      <div className="mx-auto flex max-w-[1440px] flex-col gap-12 px-6 py-xl lg:flex-row lg:px-8">
        <ShippingSideNav />

        <div className="flex-1 space-y-xl">
          <ShippingInfo />
          <PaymentMethods />
          <ReturnsPolicy />
          <SupportCenter />
          <MiniFaq />
        </div>
      </div>
    </main>
  );
}

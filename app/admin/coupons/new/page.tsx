import { CouponForm } from "../_components/coupon-form";

export default function NewCouponPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">New coupon</h1>
        <p className="mt-1 text-sm text-neutral-600">The shop charges the discount. This form only stores the rule.</p>
      </header>
      <CouponForm />
    </div>
  );
}

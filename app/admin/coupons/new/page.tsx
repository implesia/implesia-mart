import { CouponForm } from "../_components/coupon-form";

export default function NewCouponPage() {
  return (
    <div className="w-full space-y-5">
      {/* Page Header */}
      <div className="border-b border-neutral-200/80 pb-4 dark:border-white/10">
        <h1 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl dark:text-white">
          Create New Coupon
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Set discount rules, usage limits, and expiration schedule for customer checkout.
        </p>
      </div>

      <CouponForm />
    </div>
  );
}

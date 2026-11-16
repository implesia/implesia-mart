import { Suspense } from "react";

import { CouponsList } from "./_components/coupons-list";

export default function AdminCouponsPage() {
  return (
    <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" aria-busy="true" />}>
      <CouponsList />
    </Suspense>
  );
}

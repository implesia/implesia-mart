"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CatalogUnavailable() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <section
      role="alert"
      className="rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-12 text-center"
    >
      <h1 className="text-xl font-semibold text-on-surface">
        পণ্যগুলো এখন লোড করা যাচ্ছে না।
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-on-surface-variant">
        দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন।
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setPending(true);
          router.refresh();
        }}
        className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "লোড হচ্ছে…" : "আবার চেষ্টা করুন"}
      </button>
    </section>
  );
}

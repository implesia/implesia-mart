"use client";

import Link from "next/link";

export default function ShopError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="force-light flex flex-1 items-center justify-center bg-[#f5f6f8] px-4 py-16 text-neutral-950">
      <div className="max-w-md text-center" role="alert">
        <h1 className="text-2xl font-semibold">এখন দেখানো যায়নি</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          একটু পরে আবার চেষ্টা করুন। সমস্যা থাকলে হোয়াটসঅ্যাপ বা কলে জানান।
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#2bc0b5] px-5 text-sm font-semibold text-[#042422]"
          >
            আবার চেষ্টা
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-950"
          >
            হোমে ফিরুন
          </Link>
        </div>
      </div>
    </main>
  );
}

"use client";

export default function ProductError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="force-light mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center text-neutral-950">
      <div role="alert">
        <h1 className="text-2xl font-semibold">
          প্রোডাক্টটি এখন দেখানো যাচ্ছে না
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          সংযোগে সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#2bc0b5] px-5 text-sm font-semibold text-[#042422]"
      >
        আবার চেষ্টা
      </button>
    </main>
  );
}

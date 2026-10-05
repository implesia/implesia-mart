"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="bn">
      <body className="flex min-h-dvh items-center justify-center bg-[#f5f6f8] px-4 text-[#171717]">
        <div className="max-w-md text-center" role="alert">
          <h1 className="text-2xl font-semibold">সাইট এখন খোলা যায়নি</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#525252]">
            পেজ রিফ্রেশ করে আবার চেষ্টা করুন।
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#2bc0b5] px-5 text-sm font-semibold text-[#042422]"
          >
            আবার চেষ্টা
          </button>
        </div>
      </body>
    </html>
  );
}

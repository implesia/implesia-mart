import Link from "next/link";

export default function NotFound() {
  return (
    <main className="force-light flex flex-1 items-center justify-center bg-[#f5f6f8] px-4 py-16 text-neutral-950">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-[#0b5e56]">৪০৪</p>
        <h1 className="mt-2 text-2xl font-semibold">পেজটি পাওয়া যায়নি</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          লিংকটি বদলে গেছে, অথবা এই পেজ আর নেই।
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#2bc0b5] px-5 text-sm font-semibold text-[#042422]"
        >
          হোমে ফিরুন
        </Link>
      </div>
    </main>
  );
}

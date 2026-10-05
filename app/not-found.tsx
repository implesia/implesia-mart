import Link from "next/link";
import { headers } from "next/headers";

export default async function NotFound() {
  const path = (await headers()).get("x-implesia-path") ?? "";
  const product = path.startsWith("/products/");

  return (
    <main className="force-light flex flex-1 items-center justify-center bg-[#f5f6f8] px-4 py-16 text-neutral-950">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-[#0b5e56]">৪০৪</p>
        <h1 className="mt-2 text-2xl font-semibold">
          {product ? "এই পণ্যটি এখন আর পাওয়া যাচ্ছে না" : "পেজটি পাওয়া যায়নি"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          {product
            ? "প্রোডাক্টটি সরানো হয়েছে, অথবা লিংকটি সঠিক নয়।"
            : "লিংকটি বদলে গেছে, অথবা এই পেজ আর নেই।"}
        </p>
        <Link
          href={product ? "/products" : "/"}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#2bc0b5] px-5 text-sm font-semibold text-[#042422]"
        >
          {product ? "সব পণ্য দেখুন" : "হোমে ফিরুন"}
        </Link>
      </div>
    </main>
  );
}

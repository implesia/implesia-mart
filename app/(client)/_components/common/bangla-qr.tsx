"use client";

import Image from "next/image";
import { useRef, type RefObject } from "react";

import { BANGLA_QR_HINT } from "@/lib/payment";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "./material-icon";

/** Full-size QR in a native modal dialog (Esc, the close button or a backdrop tap close it). */
function QrDialog({ src, dialogRef }: { src: string; dialogRef: RefObject<HTMLDialogElement | null> }) {
  return (
    <dialog
      ref={dialogRef}
      aria-label="Bangla QR"
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      className="m-auto w-[min(92vw,24rem)] rounded-3xl bg-white p-0 text-on-background shadow-2xl backdrop:bg-black/60"
    >
      <div className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-base font-semibold">Bangla QR</p>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="inline-flex size-10 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b5e56]"
            aria-label="বন্ধ করুন"
          >
            <MaterialIcon name="close" className="text-[22px]" />
          </button>
        </div>
        <div className="relative mx-auto aspect-square w-full max-h-[70vh] overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
          <Image
            src={src}
            alt="Bangla QR কোড"
            fill
            unoptimized
            sizes="24rem"
            className="object-contain p-2"
          />
        </div>
        <p className="mt-3 text-center text-sm leading-relaxed text-neutral-700">{BANGLA_QR_HINT}</p>
      </div>
    </dialog>
  );
}

/** Small QR card for the product page. Tap to see the QR full size. */
export function BanglaQrCard({ src, className }: { src: string; className?: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-haspopup="dialog"
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-neutral-200 transition hover:ring-primary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b5e56]",
          className,
        )}
      >
        <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-neutral-200 sm:size-[72px]">
          <Image src={src} alt="Bangla QR কোড" fill unoptimized sizes="72px" className="object-contain p-1" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-[#0b5e56]">Bangla QR</span>
          <span className="mt-0.5 block text-sm leading-snug text-on-background">{BANGLA_QR_HINT}</span>
          <span className="mt-1 inline-flex items-center gap-1 text-xs text-neutral-500">
            <MaterialIcon name="zoom_in" className="text-[16px]" />
            বড় করে দেখতে ট্যাপ করুন
          </span>
        </span>
      </button>
      <QrDialog src={src} dialogRef={dialogRef} />
    </>
  );
}

/** Larger QR for checkout, also tappable to enlarge. */
export function BanglaQrPreview({ src, className }: { src: string; className?: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-haspopup="dialog"
        aria-label="Bangla QR বড় করে দেখুন"
        className={cn(
          "group relative block size-40 shrink-0 overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200 transition hover:ring-primary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b5e56]",
          className,
        )}
      >
        <Image src={src} alt="Bangla QR কোড" fill unoptimized sizes="160px" className="object-contain p-2" />
        <span className="absolute bottom-1.5 right-1.5 inline-flex size-7 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-sm ring-1 ring-neutral-200">
          <MaterialIcon name="zoom_in" className="text-[18px]" />
        </span>
      </button>
      <QrDialog src={src} dialogRef={dialogRef} />
    </>
  );
}

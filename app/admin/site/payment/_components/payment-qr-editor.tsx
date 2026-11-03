"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { MartApiError } from "@/lib/mart-api/products";
import {
  deletePaymentQr,
  getAdminPaymentSettings,
  uploadPaymentQr,
} from "@/lib/mart-api/payment-settings";
import { BANGLA_QR_HINT, type PaymentSettings } from "@/lib/payment";

import { AdminLoading, AdminNotice, AdminPageHeader, adminButtonClass } from "../../../_components/admin-ui";
import { uploadImage } from "../../../_components/image-field";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function PaymentQrEditor() {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState<PaymentSettings | null>(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<"upload" | "delete" | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminPaymentSettings()
      .then((next) => {
        if (!cancelled) setSaved(next);
      })
      .catch((e: unknown) => {
        if (!cancelled) setLoadError(e instanceof MartApiError ? e.message : "Could not load the payment QR.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const header = (
    <AdminPageHeader
      title="Payment QR"
      description="The Bangla QR image shoppers scan to pay. One image for the whole store: it shows on every product page (next to the price and Add to cart) and in checkout under the “Bangla QR” payment method. With no image, both stay hidden."
    />
  );

  if (loadError) {
    return (
      <div className="min-w-0 space-y-4">
        {header}
        <AdminNotice tone="warning">{loadError}</AdminNotice>
      </div>
    );
  }
  if (!saved) {
    return (
      <div className="min-w-0 space-y-4">
        {header}
        <AdminLoading />
      </div>
    );
  }

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busy) return;
    setError("");
    setNotice("");
    try {
      // Same type and size checks as the other image fields; the API checks the bytes too.
      URL.revokeObjectURL(await uploadImage(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Use a JPG, PNG, WEBP, or GIF image.");
      return;
    }
    setBusy("upload");
    try {
      const next = await uploadPaymentQr(file);
      setSaved(next);
      setNotice("Saved. The QR is live on the product pages and in checkout.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload the payment QR.");
    } finally {
      setBusy(null);
    }
  }

  async function onDelete() {
    if (busy) return;
    if (!window.confirm("Remove the payment QR? The QR card and the Bangla QR checkout option will disappear.")) {
      return;
    }
    setBusy("delete");
    setError("");
    setNotice("");
    try {
      const next = await deletePaymentQr();
      setSaved(next);
      setNotice("Removed. The QR card and the Bangla QR checkout option are hidden.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove the payment QR.");
    } finally {
      setBusy(null);
    }
  }

  const qr = saved.qrSrc;

  return (
    <div className="min-w-0 space-y-4">
      {header}
      <div className="grid gap-5 rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:grid-cols-[200px_1fr] sm:p-5">
        <div className="relative mx-auto aspect-square w-full max-w-[200px] overflow-hidden rounded-2xl bg-neutral-50 ring-1 ring-neutral-200">
          {qr ? (
            <Image src={qr} alt="Payment QR" fill unoptimized sizes="200px" className="object-contain p-2" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-sm text-neutral-500">
              <MaterialIcon name="qr_code_2" className="text-[40px]" />
              No QR set
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-3">
          <p className="text-sm text-neutral-700">
            Status:{" "}
            <span className={qr ? "font-semibold text-emerald-800" : "font-semibold text-neutral-600"}>
              {qr ? "On (shown to shoppers)" : "Off (hidden everywhere)"}
            </span>
          </p>
          <p className="text-sm text-neutral-600">
            Text shown under the QR: <span className="text-neutral-900">{BANGLA_QR_HINT}</span>
          </p>
          <p className="text-xs text-neutral-500">JPG, PNG, WEBP or GIF, up to 5 MB. A square, sharp image scans best.</p>
          <input
            ref={input}
            id={`${id}-file`}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={onFile}
            disabled={busy !== null}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={adminButtonClass.primary}
              onClick={() => input.current?.click()}
              disabled={busy !== null}
            >
              <MaterialIcon name="upload" className="text-[18px]" />
              {busy === "upload" ? "Uploading…" : qr ? "Replace QR" : "Upload QR"}
            </button>
            {qr ? (
              <button
                type="button"
                className={adminButtonClass.secondary}
                onClick={onDelete}
                disabled={busy !== null}
              >
                <MaterialIcon name="delete" className="text-[18px]" />
                {busy === "delete" ? "Removing…" : "Remove QR"}
              </button>
            ) : null}
          </div>
          <div aria-live="polite" className="text-sm">
            {error ? (
              <p role="alert" className="text-red-700">
                {error}
              </p>
            ) : notice ? (
              <p role="status" className="font-medium text-emerald-800">
                {notice}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

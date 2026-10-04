"use client";

import Image from "next/image";
import { useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { cn } from "@/lib/utils";

import { FieldLabel } from "./admin-ui";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

function releasePreview(src: string) {
  if (src.startsWith("blob:")) URL.revokeObjectURL(src);
}

/** Keeps the file in the browser until Save sends it to the API.
 *  The live site is a Cloudflare Worker and has no disk for this preview.
 */
export async function uploadImage(file: File): Promise<string> {
  if (!TYPES.has(file.type)) {
    throw new Error("Use a JPG, PNG, WEBP, GIF, or AVIF image.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }
  return URL.createObjectURL(file);
}

export function MultiImageUpload({
  inputId,
  onUploaded,
  onBusy,
}: {
  inputId?: string;
  onUploaded: (srcs: string[]) => void;
  onBusy?: (busy: boolean) => void;
}) {
  const fallbackId = useId();
  const id = inputId ?? fallbackId;
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState("");

  async function uploadAll(list: FileList | null | undefined) {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    setError("");
    setPending(files.length);
    onBusy?.(true);
    try {
      const results = await Promise.allSettled(files.map(uploadImage));
      const srcs = results.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : [],
      );
      if (srcs.length) onUploaded(srcs);
      const failed = results.filter(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected",
      );
      if (failed.length === 1)
        setError(
          failed[0].reason instanceof Error
            ? failed[0].reason.message
            : "Upload failed. Try again.",
        );
      else if (failed.length > 1)
        setError(
          `${failed.length} images could not be uploaded. Use JPG, PNG, WEBP, GIF, or AVIF up to 5 MB.`,
        );
    } finally {
      setPending(0);
      setDragging(false);
      onBusy?.(false);
    }
  }

  const uploading = pending > 0;

  return (
    <div>
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget.contains(event.relatedTarget as Node | null))
            return;
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!uploading) void uploadAll(event.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center gap-2 rounded-2xl border border-dashed border-neutral-300 bg-[#f7f8fa] px-4 py-5 text-center",
          dragging && "border-primary bg-primary/5",
        )}
      >
        <MaterialIcon
          name="add_photo_alternate"
          className="text-[28px] text-neutral-400"
        />
        <p className="text-sm text-neutral-600">
          {uploading
            ? `Uploading ${pending === 1 ? "1 image" : `${pending} images`}…`
            : dragging
              ? "Drop to upload"
              : "Drop images here, or pick several at once"}
        </p>
        <label
          htmlFor={id}
          className={cn(
            "inline-flex h-9 cursor-pointer items-center rounded-full bg-neutral-950 px-3 text-xs font-semibold text-white hover:bg-neutral-800",
            uploading && "pointer-events-none opacity-50",
          )}
        >
          Browse images
          <input
            id={id}
            type="file"
            accept={ACCEPT}
            multiple
            className="sr-only"
            disabled={uploading}
            onChange={(event) => {
              void uploadAll(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
        <p className="text-xs text-neutral-500">
          JPG, PNG, WEBP, GIF, or AVIF. Up to 5 MB each.
        </p>
      </div>
      {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export function ImageField({
  value,
  onChange,
  label = "Image",
  compact = false,
  confirmRemove = false,
  variant = "default",
  onBusy,
}: {
  value: string;
  onChange: (src: string) => void;
  label?: string;
  compact?: boolean;
  confirmRemove?: boolean;
  variant?: "default" | "thumb";
  onBusy?: (busy: boolean) => void;
}) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Drop an image file.");
      return;
    }
    setError("");
    setConfirmingRemove(false);
    setUploading(true);
    onBusy?.(true);
    try {
      const src = await uploadImage(file);
      releasePreview(value);
      onChange(src);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Upload failed. Try again.",
      );
    } finally {
      setUploading(false);
      setDragging(false);
      onBusy?.(false);
    }
  }

  const thumb = variant === "thumb";

  return (
    <div>
      {label ? <FieldLabel htmlFor={inputId}>{label}</FieldLabel> : null}
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget.contains(event.relatedTarget as Node | null))
            return;
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void upload(event.dataTransfer.files?.[0]);
        }}
        className={cn(
          "overflow-hidden bg-[#f7f8fa] ring-1 ring-neutral-200",
          thumb
            ? "flex items-center gap-3 rounded-xl p-2"
            : "rounded-2xl",
          dragging && "ring-2 ring-primary",
        )}
      >
        <div
          className={cn(
            "relative shrink-0 bg-[#071820]",
            thumb
              ? "size-16 overflow-hidden rounded-lg"
              : compact
                ? "aspect-square"
                : "aspect-video",
          )}
        >
          {value ? (
            <Image
              src={value}
              alt=""
              fill
              unoptimized={value.startsWith("blob:") || value.startsWith("data:")}
              sizes={thumb ? "64px" : "640px"}
              className={thumb ? "object-cover" : "object-contain p-3"}
            />
          ) : (
            <div className="grid h-full place-items-center px-2 text-center text-white/55">
              <div>
                <MaterialIcon
                  name="add_photo_alternate"
                  className={thumb ? "text-[20px]" : "text-[28px]"}
                />
                {thumb ? null : (
                  <p className="mt-2 text-sm">Drop an image here</p>
                )}
              </div>
            </div>
          )}
          {dragging ? (
            <div className="absolute inset-0 grid place-items-center bg-primary/80 text-center text-xs font-semibold text-white">
              Drop to upload
            </div>
          ) : null}
          {uploading ? (
            <div className="absolute inset-0 grid place-items-center bg-black/45 text-center text-xs font-semibold text-white">
              Uploading…
            </div>
          ) : null}
        </div>
        <div
          className={cn(
            "flex min-w-0 items-center justify-between gap-2",
            thumb
              ? "flex-1"
              : "border-t border-neutral-200 bg-white px-3 py-2",
          )}
        >
          <label
            htmlFor={inputId}
            className="inline-flex h-9 cursor-pointer items-center rounded-full bg-neutral-950 px-3 text-xs font-semibold text-white hover:bg-neutral-800"
          >
            {value ? "Replace image" : "Browse"}
            <input
              id={inputId}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              disabled={uploading}
              onChange={(event) => {
                void upload(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
          {value ? (
            confirmingRemove ? (
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    releasePreview(value);
                    onChange("");
                    setConfirmingRemove(false);
                  }}
                  className="h-9 rounded-full px-3 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  Remove image
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingRemove(false)}
                  className="h-9 rounded-full px-3 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                >
                  Keep
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (confirmRemove) {
                    setConfirmingRemove(true);
                    return;
                  }
                  releasePreview(value);
                  onChange("");
                }}
                className="h-9 rounded-full px-3 text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-red-600"
              >
                Remove
              </button>
            )
          ) : (
            <p className="text-xs text-neutral-500">
              JPG, PNG, WEBP, GIF, or AVIF. Up to 5 MB.
            </p>
          )}
        </div>
      </div>
      {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

"use client";

import Image from "next/image";
import { useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { cn } from "@/lib/utils";

import { FieldLabel } from "./admin-ui";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";

export function ImageField({
  value,
  onChange,
  label = "Image",
}: {
  value: string;
  onChange: (src: string) => void;
  label?: string;
}) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Drop an image file.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await response.json()) as { src?: string; error?: string };
      if (!response.ok || !data.src) {
        setError(data.error || "Upload failed. Try again.");
        return;
      }
      onChange(data.src);
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
      setDragging(false);
    }
  }

  return (
    <div>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
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
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void upload(event.dataTransfer.files?.[0]);
        }}
        className={cn(
          "overflow-hidden rounded-2xl bg-[#f7f8fa] ring-1 ring-neutral-200",
          dragging && "ring-2 ring-primary",
        )}
      >
        <div className="relative aspect-video bg-[#071820]">
          {value ? (
            <Image src={value} alt="" fill sizes="640px" className="object-contain p-3" />
          ) : (
            <div className="grid h-full place-items-center px-6 text-center text-white/55">
              <div>
                <MaterialIcon name="add_photo_alternate" className="text-[28px]" />
                <p className="mt-2 text-sm">Drop an image here</p>
              </div>
            </div>
          )}
          {dragging ? (
            <div className="absolute inset-0 grid place-items-center bg-primary/80 text-sm font-semibold text-white">
              Drop to upload
            </div>
          ) : null}
          {uploading ? (
            <div className="absolute inset-0 grid place-items-center bg-black/45 text-sm font-semibold text-white">
              Uploading…
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-neutral-200 bg-white px-3 py-2">
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
            <button
              type="button"
              onClick={() => onChange("")}
              className="h-9 rounded-full px-3 text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-red-600"
            >
              Remove
            </button>
          ) : (
            <p className="text-xs text-neutral-500">JPG, PNG, WEBP, GIF, or AVIF. Up to 5 MB.</p>
          )}
        </div>
      </div>
      {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

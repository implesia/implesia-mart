"use client";

import { useEffect, useRef } from "react";

import type { SingleImage } from "@/lib/mart-api/about-single-image-rules";

import { adminFieldClass, FieldError, FieldLabel } from "../../../_components/admin-ui";
import { ImageField } from "../../../_components/image-field";

/**
 * The one required photo of an About section: upload, replace or remove, plus
 * required alt text. There is deliberately no "add another photo" control.
 */
export function SingleImageField({
  id,
  value,
  onChange,
  photoError,
  altError,
  onBusy,
}: {
  id: string;
  value: SingleImage | null;
  onChange: (next: SingleImage | null) => void;
  photoError?: string;
  altError?: string;
  onBusy: (busy: boolean) => void;
}) {
  const image = value ?? { id: "photo", src: "", alt: "" };
  const root = useRef<HTMLDivElement>(null);
  const invalid = Boolean(photoError || altError);

  // Errors usually appear below the fold of the form; bring them into view.
  useEffect(() => {
    if (!invalid) return;
    root.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    if (!photoError) root.current?.querySelector<HTMLInputElement>(`#${CSS.escape(`${id}-alt`)}`)?.focus();
  }, [invalid, photoError, id]);

  return (
    <div ref={root} className="space-y-3">
      <div>
        <ImageField
          label="Photo (required)"
          value={image.src}
          confirmRemove
          onBusy={onBusy}
          onChange={(src) => onChange({ ...image, src })}
        />
        <div id={`${id}-photo-error`} aria-live="polite">
          <FieldError message={photoError} />
        </div>
      </div>
      <div>
        <FieldLabel htmlFor={`${id}-alt`}>Photo description (required)</FieldLabel>
        <input
          id={`${id}-alt`}
          value={image.alt}
          required
          aria-invalid={altError ? true : undefined}
          aria-describedby={altError ? `${id}-alt-error` : undefined}
          placeholder="What this photo shows, for screen readers"
          onChange={(event) => onChange({ ...image, alt: event.target.value })}
          className={adminFieldClass}
        />
        <div id={`${id}-alt-error`}>
          <FieldError message={altError} />
        </div>
      </div>
    </div>
  );
}

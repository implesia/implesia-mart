"use client";

import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { HomeMediaView } from "@/app/(client)/_components/home/media-section";
import { adminCoverSrc } from "@/lib/blog-view";
import {
  HOME_MEDIA_LIMITS,
  blankHomeMedia,
  homeMediaDraftError,
  homeMediaPreview,
  renderableHomeMedia,
  type HomeMediaAdmin,
  type HomeMediaType,
} from "@/lib/home-media-view";
import { getAdminHomeMedia, saveHomeMedia } from "@/lib/mart-api/home-media";
import { MartApiError } from "@/lib/mart-api/products";
import { youtubeId } from "@/lib/mart-api/youtube";
import { cn } from "@/lib/utils";

import {
  ActiveStatusField,
  AdminLoading,
  AdminNotice,
  adminButtonClass,
  adminFieldClass,
  FieldLabel,
} from "../../_components/admin-ui";
import { ImageField, VIDEO_ACCEPT, uploadVideo } from "../../_components/image-field";
import { HomeCmsHeader } from "./home-cms-header";

const SAME = (a: HomeMediaAdmin, b: HomeMediaAdmin) => JSON.stringify(a) === JSON.stringify(b);
const TYPES: { id: HomeMediaType; label: string; icon: string }[] = [
  { id: "image", label: "Image", icon: "image" },
  { id: "video", label: "Video", icon: "movie" },
  { id: "youtube", label: "YouTube", icon: "smart_display" },
];

type Toast = { tone: "success" | "error"; message: string; key: number };

function revokeBlobs(...srcs: string[]) {
  for (const src of srcs) if (src.startsWith("blob:")) URL.revokeObjectURL(src);
}

export function HomeMediaEditor() {
  const [saved, setSaved] = useState<HomeMediaAdmin | null>(null);
  const [draft, setDraft] = useState<HomeMediaAdmin>(blankHomeMedia);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  useEffect(() => {
    let cancelled = false;
    getAdminHomeMedia()
      .then((next) => {
        if (cancelled) return;
        setSaved(next);
        setDraft(next);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setLoadError(e instanceof MartApiError ? e.message : "Could not load the media section.");
        }
      });
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function notify(tone: Toast["tone"], message: string) {
    if (timer.current) clearTimeout(timer.current);
    setToast({ tone, message, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), 5000);
  }

  const dirty = saved ? !SAME(saved, draft) : false;

  function change(patch: Partial<HomeMediaAdmin>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function pickVideo(file: File | undefined) {
    if (!file) return;
    uploadVideo(file)
      .then((videoSrc) => {
        revokeBlobs(draft.videoSrc);
        change({ videoSrc });
      })
      .catch((e: unknown) => notify("error", e instanceof Error ? e.message : "Use an MP4 or WEBM video."));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !dirty) return;
    const problem = homeMediaDraftError(draft);
    if (problem) {
      notify("error", problem);
      return;
    }
    setBusy(true);
    try {
      const next = await saveHomeMedia(draft);
      revokeBlobs(draft.imageSrc, draft.videoSrc, draft.thumbnailSrc);
      setSaved(next);
      setDraft(next);
      notify(
        "success",
        next.isActive ? "Saved. The section is live on the home page." : "Saved. The section is hidden.",
      );
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Could not save the media section.");
    } finally {
      setBusy(false);
    }
  }

  const header = (
    <HomeCmsHeader
      title="Video / media"
      description="An image, uploaded video, or YouTube video shown directly above the customer reviews. Hidden until you turn it on."
      sectionId="media"
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

  const youtubeLink = draft.youtubeUrl.trim();
  const youtubeBad = draft.mediaType === "youtube" && youtubeLink !== "" && !youtubeId(youtubeLink);
  const preview = renderableHomeMedia(homeMediaPreview(draft), { preview: true });

  return (
    <div className="min-w-0 space-y-4">
      {header}
      {saved.mediaNeedsUpload ? (
        <AdminNotice tone="warning">
          A saved file can no longer be shown on the site. Upload it again and save.
        </AdminNotice>
      ) : null}
      <form
        onSubmit={onSubmit}
        className="grid min-w-0 gap-4 rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5"
        aria-busy={busy}
      >
        <ActiveStatusField checked={draft.isActive} onChange={(isActive) => change({ isActive })} />

        <div>
          <FieldLabel htmlFor={`${id}-heading`}>Heading</FieldLabel>
          <input
            id={`${id}-heading`}
            className={adminFieldClass}
            value={draft.heading}
            maxLength={HOME_MEDIA_LIMITS.heading}
            onChange={(e) => change({ heading: e.target.value })}
          />
        </div>
        <div>
          <FieldLabel htmlFor={`${id}-sub`}>Subheading (optional)</FieldLabel>
          <input
            id={`${id}-sub`}
            className={adminFieldClass}
            value={draft.subheading}
            maxLength={HOME_MEDIA_LIMITS.subheading}
            onChange={(e) => change({ subheading: e.target.value })}
          />
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-neutral-700">Media type</legend>
          <div className="grid grid-cols-3 gap-2" role="radiogroup">
            {TYPES.map((type) => {
              const active = draft.mediaType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => change({ mediaType: type.id })}
                  className={cn(
                    "flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-medium ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    active
                      ? "bg-neutral-950 text-white ring-neutral-950"
                      : "bg-white text-neutral-700 ring-neutral-200 hover:bg-neutral-50",
                  )}
                >
                  <MaterialIcon name={type.icon} className="text-[18px]" />
                  <span className="truncate">{type.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {draft.mediaType === "image" ? (
          <>
            <ImageField
              label="Image"
              variant="thumb"
              value={adminCoverSrc(draft.imageSrc)}
              onChange={(imageSrc) => change({ imageSrc })}
              onBusy={setPicking}
            />
            <p className="-mt-2 text-xs text-neutral-500">
              Wide 16:9 image, about 1920 × 1080 px (JPG, PNG, WEBP or GIF, up to 5 MB).
            </p>
          </>
        ) : null}

        {draft.mediaType === "video" ? (
          <div>
            <FieldLabel htmlFor={`${id}-video`}>Video (MP4 or WEBM, up to 50 MB)</FieldLabel>
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor={`${id}-video`}
                className={cn(adminButtonClass.secondary, "cursor-pointer")}
              >
                <MaterialIcon name="upload" className="text-[18px]" />
                {draft.videoSrc ? "Replace video" : "Choose video"}
              </label>
              <input
                id={`${id}-video`}
                type="file"
                accept={VIDEO_ACCEPT}
                className="sr-only"
                onChange={(e) => {
                  pickVideo(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              {draft.videoSrc ? (
                <button
                  type="button"
                  className={adminButtonClass.quiet}
                  onClick={() => {
                    revokeBlobs(draft.videoSrc);
                    change({ videoSrc: "" });
                  }}
                >
                  Remove video
                </button>
              ) : null}
              <span className="text-xs text-neutral-500">
                {draft.videoSrc.startsWith("blob:")
                  ? "New video — uploads when you save."
                  : draft.videoSrc
                    ? "Video saved."
                    : "No video yet."}
              </span>
            </div>
          </div>
        ) : null}

        {draft.mediaType === "youtube" ? (
          <div>
            <FieldLabel htmlFor={`${id}-yt`}>YouTube link</FieldLabel>
            <input
              id={`${id}-yt`}
              className={cn(adminFieldClass, youtubeBad && "border-red-400")}
              value={draft.youtubeUrl}
              maxLength={HOME_MEDIA_LIMITS.youtubeUrl}
              placeholder="https://www.youtube.com/watch?v=…"
              aria-invalid={youtubeBad || undefined}
              aria-describedby={`${id}-yt-hint`}
              onChange={(e) => change({ youtubeUrl: e.target.value })}
            />
            <p id={`${id}-yt-hint`} className={cn("mt-1 text-xs", youtubeBad ? "text-red-700" : "text-neutral-500")}>
              {youtubeBad
                ? "This is not a valid YouTube link."
                : "A youtube.com/watch, youtu.be or shorts link. Plays without cookies until a visitor presses play."}
            </p>
          </div>
        ) : null}

        {draft.mediaType !== "image" ? (
          <>
            <ImageField
              label="Thumbnail (optional)"
              variant="thumb"
              value={adminCoverSrc(draft.thumbnailSrc)}
              onChange={(thumbnailSrc) => change({ thumbnailSrc })}
              onBusy={setPicking}
            />
            <p className="-mt-2 text-xs text-neutral-500">
              {draft.mediaType === "video"
                ? "Shown before the video plays. 16:9, up to 5 MB."
                : "Shown with a play button before the video loads. Without one, YouTube's own thumbnail is used."}
            </p>
          </>
        ) : null}

        <div>
          <FieldLabel htmlFor={`${id}-alt`}>
            {draft.mediaType === "image" ? "Image description (alt text)" : "Video title for screen readers (optional)"}
          </FieldLabel>
          <input
            id={`${id}-alt`}
            className={adminFieldClass}
            value={draft.mediaAlt}
            maxLength={HOME_MEDIA_LIMITS.mediaAlt}
            onChange={(e) => change({ mediaAlt: e.target.value })}
          />
        </div>

        <div>
          <FieldLabel htmlFor={`${id}-desc`}>Short description under the media (optional)</FieldLabel>
          <textarea
            id={`${id}-desc`}
            rows={3}
            className={`${adminFieldClass} h-auto py-2.5`}
            value={draft.description}
            maxLength={HOME_MEDIA_LIMITS.description}
            onChange={(e) => change({ description: e.target.value })}
          />
        </div>

        <div className="grid gap-3 rounded-2xl border border-neutral-200/90 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-950">
            <input
              type="checkbox"
              className="size-4 accent-neutral-950"
              checked={draft.ctaEnabled}
              onChange={(e) => change({ ctaEnabled: e.target.checked })}
            />
            Show a button
          </label>
          {draft.ctaEnabled ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor={`${id}-cta`}>Button text</FieldLabel>
                <input
                  id={`${id}-cta`}
                  className={adminFieldClass}
                  value={draft.ctaLabel}
                  maxLength={HOME_MEDIA_LIMITS.ctaLabel}
                  onChange={(e) => change({ ctaLabel: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel htmlFor={`${id}-href`}>Button link</FieldLabel>
                <input
                  id={`${id}-href`}
                  className={adminFieldClass}
                  value={draft.ctaHref}
                  maxLength={HOME_MEDIA_LIMITS.ctaHref}
                  placeholder="/products or https://…"
                  onChange={(e) => change({ ctaHref: e.target.value })}
                />
              </div>
            </div>
          ) : null}
        </div>

        {preview ? (
          <div>
            <p className="mb-1.5 text-sm font-medium text-neutral-700">Preview</p>
            <div className="rounded-2xl bg-white p-3 ring-1 ring-neutral-200 sm:p-5">
              <HomeMediaView view={preview} />
            </div>
          </div>
        ) : null}

        <div className="flex justify-end">
          <button type="submit" className={adminButtonClass.primary} disabled={!dirty || busy || picking}>
            {busy ? "Saving…" : "Save section"}
          </button>
        </div>
      </form>

      <div
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4"
        role="status"
        aria-live="polite"
      >
        {toast ? (
          <p
            key={toast.key}
            className={cn(
              "pointer-events-auto flex max-w-md items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-xl",
              toast.tone === "success" ? "bg-emerald-700" : "bg-red-700",
            )}
          >
            <MaterialIcon name={toast.tone === "success" ? "check_circle" : "error"} className="text-[18px]" />
            {toast.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}

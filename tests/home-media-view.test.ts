import assert from "node:assert/strict";
import { test } from "node:test";

import {
  blankHomeMedia,
  homeMediaDraftError,
  homeMediaPreview,
  renderableHomeMedia,
  safeHttpsCtaHref,
  type HomeMediaAdmin,
  type HomeMediaPublic,
} from "@/lib/home-media-view";

const live: HomeMediaPublic = {
  heading: "See it in action",
  subheading: "A quick look",
  mediaType: "image",
  imageSrc: "/media/home-media/a.jpg",
  videoSrc: "",
  youtubeId: "",
  thumbnailSrc: "",
  mediaAlt: "Products on a shelf",
  description: "Short text",
  ctaLabel: "Shop now",
  ctaHref: "/products",
};

const draft = (patch: Partial<HomeMediaAdmin>): HomeMediaAdmin => ({
  ...blankHomeMedia(),
  heading: "Watch",
  ...patch,
});

test("button links allow site paths and https only", () => {
  assert.equal(safeHttpsCtaHref("/products?x=1"), "/products?x=1");
  assert.equal(safeHttpsCtaHref("https://example.com/sale"), "https://example.com/sale");
  for (const bad of ["http://example.com", "//evil.example", "/a/../b", "javascript:alert(1)", "/a b", ""]) {
    assert.equal(safeHttpsCtaHref(bad), "", bad);
  }
});

test("an image section renders with its alt text and an internal button", () => {
  const view = renderableHomeMedia(live);
  assert.ok(view);
  assert.equal(view.media.type, "image");
  assert.equal(view.alt, "Products on a shelf");
  assert.deepEqual(view.cta, { href: "/products", label: "Shop now", external: false });
  assert.equal(renderableHomeMedia({ ...live, mediaAlt: "" }), null);
  assert.equal(renderableHomeMedia({ ...live, heading: " " }), null);
  assert.equal(renderableHomeMedia(null), null);
});

test("video needs an mp4/webm file; the poster is optional", () => {
  const video = renderableHomeMedia({
    ...live,
    mediaType: "video",
    imageSrc: "",
    videoSrc: "/media/home-media/v.mp4",
    thumbnailSrc: "/media/home-media/p.jpg",
  });
  assert.ok(video && video.media.type === "video");
  assert.match(video.media.src, /\/media\/home-media\/v\.mp4$/);
  assert.match(video.media.poster, /p\.jpg$/);
  assert.equal(renderableHomeMedia({ ...live, mediaType: "video", videoSrc: "/media/x.mov" }), null);
  // Unsaved browser files only show in the admin preview.
  const blob = { ...live, mediaType: "video" as const, videoSrc: "blob:http://localhost/x" };
  assert.equal(renderableHomeMedia(blob), null);
  assert.ok(renderableHomeMedia(blob, { preview: true }));
});

test("youtube uses the nocookie embed with autoplay and falls back to YouTube's thumbnail", () => {
  const view = renderableHomeMedia({ ...live, mediaType: "youtube", youtubeId: "dQw4w9WgXcQ" });
  assert.ok(view && view.media.type === "youtube");
  assert.equal(
    view.media.embed,
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&autoplay=1",
  );
  assert.equal(view.media.thumb, "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
  assert.equal(renderableHomeMedia({ ...live, mediaType: "youtube", youtubeId: "bad" }), null);
});

test("external https buttons are marked external; unsafe ones are dropped", () => {
  assert.equal(renderableHomeMedia({ ...live, ctaHref: "https://example.com" })?.cta?.external, true);
  assert.equal(renderableHomeMedia({ ...live, ctaHref: "http://example.com" })?.cta, null);
});

test("draft errors mirror the API rules", () => {
  assert.equal(homeMediaDraftError(blankHomeMedia()), "");
  assert.match(homeMediaDraftError(draft({ isActive: true })), /image/);
  assert.match(homeMediaDraftError(draft({ isActive: true, imageSrc: "/media/a.jpg" })), /alt/);
  assert.match(homeMediaDraftError(draft({ isActive: true, mediaType: "video" })), /video/);
  assert.match(homeMediaDraftError(draft({ mediaType: "youtube", youtubeUrl: "https://vimeo.com/1" })), /YouTube/);
  assert.equal(
    homeMediaDraftError(draft({ isActive: true, mediaType: "youtube", youtubeUrl: "https://youtu.be/dQw4w9WgXcQ" })),
    "",
  );
  assert.match(homeMediaDraftError(draft({ ctaEnabled: true, ctaLabel: "Go" })), /button/);
  assert.match(homeMediaDraftError(draft({ ctaEnabled: true, ctaLabel: "Go", ctaHref: "http://x.com" })), /https/);
  assert.equal(homeMediaDraftError(draft({ ctaEnabled: false, ctaHref: "http://x.com" })), "");
});

test("the preview hides a turned-off button and reads the YouTube id from the link", () => {
  const view = homeMediaPreview(
    draft({ mediaType: "youtube", youtubeUrl: "https://youtu.be/dQw4w9WgXcQ", ctaLabel: "Go", ctaHref: "/x" }),
  );
  assert.equal(view.youtubeId, "dQw4w9WgXcQ");
  assert.equal(view.ctaHref, "");
});

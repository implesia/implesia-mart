import assert from "node:assert/strict";
import test from "node:test";

import {
  MISSING_ALT,
  MISSING_PHOTO,
  pickSingleImage,
  singleImageErrors,
} from "@/lib/mart-api/about-single-image-rules";

test("pickSingleImage prefers image, falls back to legacy images[0]", () => {
  const a = { id: "a", src: "/a.jpg", alt: "A" };
  const b = { id: "b", src: "/b.jpg", alt: "B" };
  assert.equal(pickSingleImage({ image: a, images: [b] })?.id, "a");
  assert.equal(pickSingleImage({ images: [b, a] })?.id, "b");
  assert.equal(pickSingleImage({ image: null, images: [] }), null);
  assert.equal(pickSingleImage({ image: { id: "x", src: "", alt: "" } }), null);
  assert.equal(pickSingleImage({}), null);
});

test("singleImageErrors mirrors backend required photo and alt", () => {
  assert.deepEqual(singleImageErrors(null), { photo: MISSING_PHOTO, alt: MISSING_ALT });
  assert.deepEqual(singleImageErrors({ src: "x.jpg", alt: "  " }), { photo: "", alt: MISSING_ALT });
  assert.deepEqual(singleImageErrors({ src: "", alt: "ok" }), { photo: MISSING_PHOTO, alt: "" });
  assert.deepEqual(singleImageErrors({ src: "x.jpg", alt: "ok" }), { photo: "", alt: "" });
});

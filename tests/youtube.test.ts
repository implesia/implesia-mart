import assert from "node:assert/strict";
import test from "node:test";

import { youtubeEmbed, youtubeId, youtubeThumb } from "../lib/mart-api/youtube.ts";

test("watch, youtu.be, shorts, and embed links give the video id", () => {
  for (const link of [
    "dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s",
    "https://m.youtube.com/watch?feature=share&v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ?si=abc",
    "youtube.com/shorts/dQw4w9WgXcQ",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  ]) {
    assert.equal(youtubeId(link), "dQw4w9WgXcQ", link);
  }
});

test("anything else is not a YouTube video", () => {
  for (const link of [
    "",
    "hello",
    "https://vimeo.com/123",
    "https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=short",
    "https://www.youtube.com/@channel",
    "javascript:alert(1)",
  ]) {
    assert.equal(youtubeId(link), "", link);
  }
});

test("thumbnail and privacy-enhanced embed addresses", () => {
  assert.equal(youtubeThumb("dQw4w9WgXcQ"), "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
  assert.ok(youtubeEmbed("dQw4w9WgXcQ").startsWith("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"));
});

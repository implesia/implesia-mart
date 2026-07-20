import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Implesia Mart — Trending Gadgets & Handmade Custom Dresses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Site-wide social share card. Individual product/blog pages override this with their own image. */
export default async function OpengraphImage() {
  const logoData = await readFile(
    join(process.cwd(), "public/images/common/logo-white.png"),
  );
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(ellipse 80% 65% at 15% 10%, rgba(43,192,181,0.4), transparent 55%), #062f2c",
          position: "relative",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={440} height={110} alt="" />
        <div
          style={{
            marginTop: 36,
            fontSize: 30,
            letterSpacing: 1,
            color: "rgba(255,255,255,0.8)",
            fontFamily: "sans-serif",
          }}
        >
          Trending Gadgets &amp; Handmade Custom Dresses
        </div>
      </div>
    ),
    { ...size },
  );
}

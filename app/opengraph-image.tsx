import { ImageResponse } from "next/og";
import { OG_LOGO_DATA_URL } from "@/lib/og-assets";

export const alt = "Implesia Mart — Trending Gadgets & Handmade Custom Dresses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Site-wide social share card. Individual product/blog pages override this with their own image. */
export default function OpengraphImage() {
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
          backgroundColor: "#062f2c",
          backgroundImage:
            "radial-gradient(ellipse 80% 65% at 15% 10%, rgba(43,192,181,0.4), transparent 55%)",
          position: "relative",
        }}
      >
        <img src={OG_LOGO_DATA_URL} width={440} height={110} alt="" />
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

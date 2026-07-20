import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Minimal brand mark using the same primary teal used across the UI. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2bc0b5",
          borderRadius: 7,
          color: "#ffffff",
          fontSize: 19,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        iM
      </div>
    ),
    { ...size },
  );
}

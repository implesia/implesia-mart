/**
 * Renders a JSON-LD <script> tag per Next.js's recommended structured-data
 * pattern. Angle brackets are escaped to prevent script-injection via
 * user-influenced content (product/blog copy) ending up in the payload.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

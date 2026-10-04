import type { NextConfig } from "next";

const api = new URL(
  process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001",
);
const localApi = api.hostname === "127.0.0.1" || api.hostname === "localhost";

type RemotePattern = NonNullable<NextConfig["images"]>["remotePatterns"] extends
  | readonly (infer Pattern)[]
  | undefined
  ? Pattern
  : never;

function remotePattern(
  protocol: "http" | "https",
  hostname: string,
  port = "",
): RemotePattern {
  return {
    protocol,
    hostname,
    ...(port ? { port } : {}),
    pathname: "/**",
  };
}

function uniquePatterns(patterns: RemotePattern[]) {
  const seen = new Set<string>();
  return patterns.filter((pattern) => {
    const key = `${pattern.protocol}://${pattern.hostname}:${pattern.port ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const nextConfig: NextConfig = {
  /* Don't advertise the framework in response headers. */
  poweredByHeader: false,
  images: {
    // The local API serves product photos from 127.0.0.1. The optimizer
    // refuses private addresses unless this is set.
    dangerouslyAllowLocalIP: localApi,
    remotePatterns: uniquePatterns([
      remotePattern("https", "lh3.googleusercontent.com"),
      remotePattern("https", "placehold.co"),
      // The production build must allow this host even when the API URL
      // env var is absent while next.config is evaluated.
      remotePattern("https", "mart-api.implesia.com"),
      remotePattern(
        api.protocol === "https:" ? "https" : "http",
        api.hostname,
        api.port,
      ),
    ]),
  },
};

export default nextConfig;

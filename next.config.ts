import type { NextConfig } from "next";

const api = new URL(
  process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001",
);
const localApi = api.hostname === "127.0.0.1" || api.hostname === "localhost";

const nextConfig: NextConfig = {
  /* Don't advertise the framework in response headers. */
  poweredByHeader: false,
  images: {
    // The local API serves product photos from 127.0.0.1. The optimizer
    // refuses private addresses unless this is set.
    dangerouslyAllowLocalIP: localApi,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
      {
        protocol: api.protocol === "https:" ? "https" : "http",
        hostname: api.hostname,
        ...(api.port ? { port: api.port } : {}),
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

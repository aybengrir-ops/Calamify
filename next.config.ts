import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // youtubei.js is a heavy ESM package that touches Node internals – keep it
  // out of the webpack bundle and load it natively in the Node runtime.
  serverExternalPackages: ["youtubei.js", "cheerio"],
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Content-Type", value: "application/manifest+json" }],
      },
      {
        source: "/api/audio/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Accept-Ranges", value: "bytes" },
          { key: "Access-Control-Expose-Headers", value: "Content-Length, Content-Range, Accept-Ranges" },
        ],
      },
    ];
  },
};

export default nextConfig;

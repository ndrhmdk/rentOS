import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reset links contain credentials; do not print their query strings in development logs.
  logging: { incomingRequests: { ignore: [/^\/reset-password(?:\?|$)/] } },
  async headers() {
    return [{ source: "/reset-password", headers: [
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "Cache-Control", value: "private, no-store, max-age=0" },
    ] }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

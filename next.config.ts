import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Sandbox preview reaches the dev server through the gateway/proxy chain
  // (127.0.0.1:81 -> 3000 -> 3001); without this, Next 16 blocks those
  // cross-origin requests to dev resources (fonts, HMR) as unsafe.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async redirects() {
    // Resolve the legacy alias before the client workspace guard renders.
    return [
      { source: "/admin/logs", destination: "/admin/audit", permanent: false },
    ];
  },
};

export default nextConfig;

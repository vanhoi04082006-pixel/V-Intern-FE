import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    // Resolve the legacy alias before the client workspace guard renders.
    return [
      { source: "/admin/logs", destination: "/admin/audit", permanent: false },
    ];
  },
};

export default nextConfig;

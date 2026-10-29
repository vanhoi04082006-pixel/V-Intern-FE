import type { NextConfig } from "next";

/**
 * Proxy mọi request /api/v1/* sang V-Intern backend (NestJS).
 *
 * - Mặc định: BACKEND_URL (http://localhost:8080 — port mặc định của V-Intern-BE).
 * - Muốn browser gọi thẳng BE (bypass proxy): set NEXT_PUBLIC_API_BASE_URL.
 *
 * Proxy giữ nguyên Authorization header + cookie (refresh token HttpOnly
 * có Path=/api/v1/auth nên hoạt động ngay trên origin FE).
 */
const backend = (process.env.BACKEND_URL ?? "http://localhost:8080").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backend}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;

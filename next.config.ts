import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove output: "export" - we need SSR for API routes
  images: {
    unoptimized: true
  },
  reactCompiler: true
};

export default nextConfig;
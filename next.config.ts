import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // ✅ REQUIRED for Cloudflare Pages static hosting
  images: {
    unoptimized: true // ✅ REQUIRED so Next/Image works on static hosting
  },
  reactCompiler: true
};

export default nextConfig;
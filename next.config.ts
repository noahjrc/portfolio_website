import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Export as a fully static site
  output: "export",
  // 2. Ensure trailing slash so files land under `out/`
  trailingSlash: true,
  // 3. Disable Next.js Image Optimization (since there's no server)
  images: {
    unoptimized: true,
  },
  // 4. Do NOT set basePath or assetPrefix here – leave them off entirely
};

export default nextConfig;

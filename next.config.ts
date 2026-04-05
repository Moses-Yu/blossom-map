import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/trees": ["./data/trees.db"],
  },
};

export default nextConfig;

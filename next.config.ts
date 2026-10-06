import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { resolveAlias: { "@": "./src", "opentype.js/dist/opentype.module.js": "opentype.js/dist/opentype.mjs" } },
};

export default nextConfig;

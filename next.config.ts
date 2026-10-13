import type { NextConfig } from "next";
import path from "node:path";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const config: NextConfig = {
  distDir: process.env.NEXT_DIST ?? ".next",
  turbopack: { root: path.resolve(process.cwd()) },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default config;

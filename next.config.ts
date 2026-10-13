import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [],
  transpilePackages: ["firebase-admin"],
};

export default nextConfig;

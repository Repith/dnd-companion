/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    turbopack: {
      root: "/app",
    },
  },
  env: {
    BACKEND_URL: process.env.BACKEND_URL || "http://localhost:3002",
  },
};

export default nextConfig;

import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  async headers() {
    const serviceWorkerHeaders = [
      {
        key: "Content-Type",
        value: "application/javascript; charset=utf-8",
      },
      {
        key: "Cache-Control",
        value: "no-cache, no-store, must-revalidate",
      },
      {
        key: "Content-Security-Policy",
        value:
          "default-src 'self'; script-src 'self' https://cdn.onesignal.com",
      },
    ];

    return [
      {
        source: "/sw.js",
        headers: serviceWorkerHeaders,
      },
      {
        source: "/OneSignalSDKWorker.js",
        headers: serviceWorkerHeaders,
      },
      {
        source: "/OneSignalSDKUpdaterWorker.js",
        headers: serviceWorkerHeaders,
      },
    ];
  },
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    qualities: [50],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);

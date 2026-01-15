import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Increase body size limit for server actions (videos, large images)
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Allow images from Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
      },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseHostname: string | undefined;

if (supabaseUrl) {
  try {
    const parsedUrl = new URL(supabaseUrl);

    if (parsedUrl.protocol === "https:") {
      supabaseHostname = parsedUrl.hostname;
    }
  } catch {
    supabaseHostname = undefined;
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/product-images/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;

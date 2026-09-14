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

export function buildContentSecurityPolicy(
  hostname: string | undefined,
  isDevelopment: boolean
): string {
  const scriptSources = [
    "'self'",
    "'unsafe-inline'",
    ...(isDevelopment ? ["'unsafe-eval'"] : []),
  ];
  const imageSources = [
    "'self'",
    "data:",
    "blob:",
    "https://images.unsplash.com",
    ...(hostname ? [`https://${hostname}`] : []),
  ];
  const connectionSources = [
    "'self'",
    ...(isDevelopment ? ["ws:", "wss:"] : []),
  ];

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imageSources.join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${connectionSources.join(" ")}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

const contentSecurityPolicy = buildContentSecurityPolicy(
  supabaseHostname,
  process.env.NODE_ENV === "development"
);

export function buildSecurityHeaders(
  policy: string,
  isProduction: boolean
) {
  return [
    {
      key: "Content-Security-Policy",
      value: policy,
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
    ...(isProduction
      ? [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ]
      : []),
  ];
}

export const securityHeaders = buildSecurityHeaders(
  contentSecurityPolicy,
  process.env.NODE_ENV === "production"
);

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
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

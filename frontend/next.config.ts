import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'profile.line-scdn.net',
        pathname: '/**',
      },

      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'api-volunteer-eservice.govcenter.co',
        pathname: '/uploads/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  experimental: {
    optimizePackageImports: [
      'react-icons',
      'lucide-react',
    ],
  },

  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },

  async redirects() {
    return [];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: (() => {
              const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
              const wsUrl = apiUrl.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
              return [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.line-scdn.net https://liff.line.me https://static.cloudflareinsights.com",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.mapbox.com",
                "font-src 'self' https://fonts.gstatic.com",
                `img-src 'self' data: blob: https://profile.line-scdn.net https://*.tile.openstreetmap.org https://a.tile.openstreetmap.org https://b.tile.openstreetmap.org https://c.tile.openstreetmap.org https://cdnjs.cloudflare.com https://raw.githubusercontent.com https://api.mapbox.com https://*.tiles.mapbox.com https://*.google.com ${apiUrl}`,
                `connect-src 'self' data: blob: https://api.line.me https://liff.line.me https://auth.govcenter.co https://api-auth.govcenter.co https://api.mapbox.com https://*.tiles.mapbox.com https://events.mapbox.com https://nominatim.openstreetmap.org ${apiUrl} ${wsUrl}`,
                "worker-src 'self' blob:",
                "frame-src 'self' https://liff.line.me",
              ].join('; ');
            })(),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

export default nextConfig;



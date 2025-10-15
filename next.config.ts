import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // ============================================================================
  // PERFORMANCE OPTIMIZATIONS
  // ============================================================================
  
  // Enable React strict mode for better development
  reactStrictMode: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      // Add your CDN domain here
      // {
      //   protocol: 'https',
      //   hostname: 'cdn.yourdomain.com',
      // },
    ],
    minimumCacheTTL: 60, // Cache images for 60 seconds
  },
  
  // Enable compression
  compress: true,
  
  // Optimize production builds
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Experimental features for better performance
  experimental: {
    // Enable optimized package imports (tree-shaking)
    // Note: lucide-react removed due to barrel optimization issues in Next.js 15
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
  },
  
  // Turbopack configuration (replaces deprecated experimental.turbo)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Webpack configuration for bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Bundle analyzer (only in development)
    if (!dev && !isServer && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: './bundle-analysis.html',
          openAnalyzer: true,
        })
      );
    }
    
    return config;
  },
  
  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
      // Cache static assets aggressively
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache API responses briefly
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=10, stale-while-revalidate=59',
          },
        ],
      },
    ];
  },
  
  // ============================================================================
  // OUTPUT CONFIGURATION
  // ============================================================================
  
  output: 'standalone', // Optimize for portable Node deployments
  
  // ============================================================================
  // REDIRECTS & REWRITES
  // ============================================================================
  
  async redirects() {
    return [
      // Add redirects here if needed
    ];
  },
  
  async rewrites() {
    return [
      // Add rewrites here if needed
    ];
  },
};

export default nextConfig;

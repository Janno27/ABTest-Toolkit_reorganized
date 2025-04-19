const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/components': path.resolve(__dirname, './app/components'),
      '@/lib': path.resolve(__dirname, './app/lib'),
      '@/hooks': path.resolve(__dirname, './app/hooks'),
      '@/services': path.resolve(__dirname, './app/services'),
      '@/utils': path.resolve(__dirname, './app/utils'),
      '@/public': path.resolve(__dirname, './public'), // {{Add public alias}}
      '@/types': path.resolve(__dirname, './app/types') // {{Add types alias}}
    };
    return config;
  },
};

module.exports = nextConfig;
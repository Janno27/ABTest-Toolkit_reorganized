const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Configuration des alias de chemin
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/components': path.resolve(__dirname, './app/components'),
      '@/lib': path.resolve(__dirname, './app/lib'),
      '@/hooks': path.resolve(__dirname, './app/hooks'),
      '@/services': path.resolve(__dirname, './app/services'),
      '@/utils': path.resolve(__dirname, './app/utils'),
    };
    return config;
  },
};

module.exports = nextConfig;

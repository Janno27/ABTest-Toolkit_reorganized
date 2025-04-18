const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Désactiver les vérifications TypeScript
  typescript: {
    ignoreBuildErrors: true, // À UTILISER AVEC PRÉCAUTION !
  },
  // Désactiver ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true 
  },
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

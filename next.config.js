/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  // Bundle optimization
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@nextui-org/react',
      'chart.js',
      'react-chartjs-2'
    ],
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    domains: ['expense-tracker-sujaltlrj.vercel.app'],
    formats: ['image/webp', 'image/avif'],
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Chart.js optimization
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    // Bundle analyzer in development
    if (dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
          charts: {
            test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
            name: 'charts',
            priority: 10,
            chunks: 'all',
          },
        },
      };
    }

    return config;
  },
};

module.exports = withPWA(nextConfig);
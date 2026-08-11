import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  ...({ skipWaiting: true } as any),
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {},
  output: (process.env.NEXT_STANDALONE === 'true' ? 'standalone' : undefined) as any,
  async rewrites() {
    const isProd = process.env.NODE_ENV === 'production';
    const apiTarget = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || (isProd ? 'https://api.chat.scryme.tech' : 'http://localhost:3000');
    return [
      {
        source: '/api/:path*',
        destination: `${apiTarget.replace(/\/$/, '')}/api/:path*`,
      },
    ];
  },
};

export default withPWA(nextConfig);

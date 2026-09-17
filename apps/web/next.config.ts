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
    const target = apiTarget.replace(/\/$/, '');

    const proxiedRoutes = [
      'workspaces',
      'v3',
      'v2',
      'dms',
      'channels',
      'invitations',
      'scheduled-notifications',
      'notifications',
      'admin',
      'calls',
      'friends',
      'assets',
      'device-auth',
      'android-auth',
      'bot',
      'integrations',
      'support',
      'ably',
      'storage',
      's',
      'users',
      'config',
    ];

    return proxiedRoutes.map((route) => ({
      source: `/api/${route}/:path*`,
      destination: `${target}/api/${route}/:path*`,
    }));
  },
};

export default withPWA(nextConfig);

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
    const apiUrl = process.env.API_URL || (process.env.NODE_ENV === 'production' ? 'http://api:3000' : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
    return [
      {
        source: '/api/users/me',
        destination: `${apiUrl}/api/users/me`,
      },
      {
        source: '/api/workspaces/:path*',
        destination: `${apiUrl}/api/workspaces/:path*`,
      },
      {
        source: '/api/invitations/:path*',
        destination: `${apiUrl}/api/invitations/:path*`,
      },
      {
        source: '/api/integrations/:path*',
        destination: `${apiUrl}/api/integrations/:path*`,
      },
      {
        source: '/api/workspaces/:slug/members/:memberId',
        destination: `${apiUrl}/api/workspaces/:slug/members/:memberId`,
      },
      {
        source: '/api/workspaces/:slug/channels',
        destination: `${apiUrl}/api/workspaces/:slug/channels`,
      },
      {
        source: '/api/admin/:path*',
        destination: `${apiUrl}/api/admin/:path*`,
      },
      {
        source: '/api/dms/:path*',
        destination: `${apiUrl}/api/dms/:path*`,
      },
      {
        source: '/api/friends/:path*',
        destination: `${apiUrl}/api/friends/:path*`,
      },
      {
        source: '/api/calls/:path*',
        destination: `${apiUrl}/api/calls/:path*`,
      },
      {
        source: '/api/channels/:path*',
        destination: `${apiUrl}/api/channels/:path*`,
      },
      {
        source: '/api/notifications/:path*',
        destination: `${apiUrl}/api/notifications/:path*`,
      },
      {
        source: '/api/ably/:path*',
        destination: `${apiUrl}/api/ably/:path*`,
      },
      {
        source: '/api/auth/ably',
        destination: `${apiUrl}/api/ably/token`,
      },
      {
        source: '/api/scheduled-notifications/:path*',
        destination: `${apiUrl}/api/scheduled-notifications/:path*`,
      },
      {
        source: '/api/bot/v10/:path*',
        destination: `${apiUrl}/api/bot/v10/:path*`,
      },
      {
        source: '/api/v2/:path*',
        destination: `${apiUrl}/api/v2/:path*`,
      },
      {
        source: '/api/device-auth/:path*',
        destination: `${apiUrl}/api/device-auth/:path*`,
      },
    ];
  },
};

export default withPWA(nextConfig);

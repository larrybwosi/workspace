import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    return config;
  },
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/users/me',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/users/me`,
      },
      {
        source: '/api/workspaces/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/workspaces/:path*`,
      },
      {
        source: '/api/invitations/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/invitations/:path*`,
      },
      {
        source: '/api/integrations/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/integrations/:path*`,
      },
      {
        source: '/api/workspaces/:slug/members/:memberId',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/workspaces/:slug/members/:memberId`,
      },
      {
        source: '/api/workspaces/:slug/channels',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/workspaces/:slug/channels`,
      },
      {
        source: '/api/admin/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/admin/:path*`,
      },
      {
        source: '/api/dms/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/dms/:path*`,
      },
      {
        source: '/api/friends/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/friends/:path*`,
      },
      {
        source: '/api/calls/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/calls/:path*`,
      },
      {
        source: '/api/channels/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/channels/:path*`,
      },
      {
        source: '/api/notifications/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/notifications/:path*`,
      },
      {
        source: '/api/ably/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/ably/:path*`,
      },
      {
        source: '/api/auth/ably',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/ably/token`,
      },
      {
        source: '/api/scheduled-notifications/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/scheduled-notifications/:path*`,
      },
      {
        source: '/api/bot/v10/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/bot/v10/:path*`,
      },
      {
        source: '/api/v2/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v2/:path*`,
      },
    ]
  },
}

export default withPWA(nextConfig)

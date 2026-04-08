/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
        source: '/api/v10/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v10/:path*`,
      },
      {
        source: '/api/v2/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v2/:path*`,
      },
    ]
  },
}

export default nextConfig

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
        source: '/api/workspaces',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/workspaces`,
      },
      {
        source: '/api/workspaces/:slug',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/workspaces/:slug`,
      },
      {
        source: '/api/workspaces/:slug/members',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/workspaces/:slug/members`,
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
        source: '/api/workspaces/:slug/integrations/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/workspaces/:slug/integrations/:path*`,
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
        source: '/api/v10/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v10/:path*`,
      },
    ]
  },
}

export default nextConfig

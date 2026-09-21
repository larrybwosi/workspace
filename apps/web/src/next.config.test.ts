jest.mock('@ducanh2912/next-pwa', () => () => (config: any) => config);

import nextConfig from '../next.config';

describe('next.config.ts rewrites', () => {
  it('should only proxy necessary backend API routes and not catch-all /api/:path*', async () => {
    if (typeof nextConfig.rewrites !== 'function') {
      throw new Error('nextConfig.rewrites is not a function');
    }

    const rewrites = await nextConfig.rewrites();
    const rewriteList = Array.isArray(rewrites) ? rewrites : rewrites.afterFiles || [];

    // Ensure catch-all /api/:path* is NOT present
    const hasCatchAll = rewriteList.some((rule: any) => rule.source === '/api/:path*');
    expect(hasCatchAll).toBe(false);

    // Ensure local Next.js API routes are NOT proxied
    const localRoutes = [
      '/api/auth/:path*',
      '/api/health',
      '/api/upload',
      '/api/assistant/:path*',
      '/api/agora/:path*',
      '/api/link-preview',
      '/api/push-notifications/:path*',
      '/api/profile-assets',
      '/api/device-tokens',
      '/api/webhooks/:path*',
    ];

    for (const route of localRoutes) {
      const isProxied = rewriteList.some((rule: any) => rule.source === route);
      expect(isProxied).toBe(false);
    }

    // Ensure necessary backend API routes are proxied
    const expectedBackendPrefixes = [
      'workspaces',
      'organizations',
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

    for (const prefix of expectedBackendPrefixes) {
      const match = rewriteList.find((rule: any) => rule.source === `/api/${prefix}/:path*`);
      expect(match).toBeDefined();
      expect(match?.destination).toContain(`/api/${prefix}/:path*`);
    }
  });
});

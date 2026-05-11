import { PrismaClient } from './packages/database/src/generated';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.create({
    data: {
      name: 'Test Org',
      slug: 'test-org-' + Date.now(),
    }
  });

  const m2mApp = await prisma.m2mApplication.create({
    data: {
      name: 'Test App',
      clientId: 'test-client-' + Date.now(),
      clientSecret: 'test-secret',
      organizationId: org.id,
      scopes: ['provisioning:workspaces'],
    }
  });

  console.log('Created M2M App:', m2mApp.clientId);

  const rawToken = 'oat_' + crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const userId = 'm2m:' + org.id;

  try {
    console.log('Attempting to issue token...');
    const accessToken = await (prisma as any).oauthAccessToken.create({
      data: {
        id: crypto.randomBytes(16).toString('hex'),
        token: hashedToken,
        clientId: m2mApp.clientId,
        userId: userId,
        expiresAt: new Date(Date.now() + 3600 * 1000),
        scopes: ['*'],
        createdAt: new Date(),
      },
    });
    console.log('Token issued successfully:', accessToken.id);
  } catch (error) {
    console.error('Failed to issue token:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

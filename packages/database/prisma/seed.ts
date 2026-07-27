import { prisma } from '../index.js';

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Users
  console.log('Seeding users...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {
      role: 'Admin',
    },
    create: {
      email: 'admin@test.com',
      name: 'Admin User',
      username: 'admin',
      role: 'Admin',
    },
  });

  const testUser = await prisma.user.upsert({
    where: { email: 'user@test.com' },
    update: {},
    create: {
      email: 'user@test.com',
      name: 'Test User',
      username: 'testuser',
      role: 'user',
    },
  });

  // 2. Seed default Workspace
  console.log('Seeding workspace...');
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Default Workspace',
      slug: 'default',
      ownerId: admin.id,
    },
  });

  // 3. Seed Workspace Memberships
  console.log('Seeding workspace members...');
  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: admin.id,
      },
    },
    update: {
      role: 'owner',
    },
    create: {
      workspaceId: workspace.id,
      userId: admin.id,
      role: 'owner',
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: testUser.id,
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: testUser.id,
      role: 'member',
    },
  });

  // 4. Seed default general Channel
  console.log('Seeding channel...');
  const channel = await prisma.channel.upsert({
    where: {
      workspaceId_slug: {
        workspaceId: workspace.id,
        slug: 'general',
      },
    },
    update: {},
    create: {
      name: 'General',
      slug: 'general',
      icon: 'hashtag',
      workspaceId: workspace.id,
      createdById: admin.id,
    },
  });

  // 5. Seed Channel Memberships
  console.log('Seeding channel members...');
  await prisma.channelMember.upsert({
    where: {
      channelId_userId: {
        channelId: channel.id,
        userId: admin.id,
      },
    },
    update: {
      role: 'admin',
    },
    create: {
      channelId: channel.id,
      userId: admin.id,
      role: 'admin',
    },
  });

  await prisma.channelMember.upsert({
    where: {
      channelId_userId: {
        channelId: channel.id,
        userId: testUser.id,
      },
    },
    update: {},
    create: {
      channelId: channel.id,
      userId: testUser.id,
      role: 'member',
    },
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

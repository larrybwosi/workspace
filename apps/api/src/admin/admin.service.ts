import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prismaService: PrismaService) {}

  async getStats() {
    const totalUsers = await this.prismaService.client.user.count();
    const activeUsers = await this.prismaService.client.user.count();
    const totalWorkspaces = await this.prismaService.client.workspace.count();
    const totalMessages = await this.prismaService.client.message.count();

    // Mock growth and storage stats for now
    return {
      totalUsers,
      activeUsers,
      totalWorkspaces,
      totalMessages,
      totalProjects: totalWorkspaces, // Use workspaces as projects
      totalTasks: 0,
      completedTasks: 0,
      storageUsed: 1.2,
      storageTotal: 100,
      userGrowth: 5.2,
      activityGrowth: 3.1,
    };
  }

  async getMembers(filters: { search?: string; role?: string; status?: string }) {
    const where: any = {};
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.role && filters.role !== 'all') {
      where.role = filters.role;
    }

    const users = await this.prismaService.client.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return users.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'Member',
      status: 'active', // Mock status
      avatar: user.image || user.avatar,
      joinedAt: user.createdAt,
      lastActive: user.updatedAt,
      invitedBy: 'System',
    }));
  }

  async updateMemberRole(userId: string, role: string) {
    return this.prismaService.client.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  async getAssets(type: string) {
    if (type === 'emoji') {
        return this.prismaService.client.customEmoji.findMany({ where: { isGlobal: true } });
    }
    if (type === 'sticker') {
        return this.prismaService.client.sticker.findMany({ where: { isGlobal: true } });
    }
    if (type === 'sound') {
        return this.prismaService.client.soundboardSound.findMany({ where: { isGlobal: true } });
    }
    if (type === 'profile_asset') {
        return this.prismaService.client.profileAsset.findMany({ where: { isGlobal: true } });
    }

    return [];
  }

  async createAsset(type: string, data: any) {
    if (type === 'emoji') {
        return this.prismaService.client.customEmoji.create({ data });
    }
    if (type === 'sticker') {
        return this.prismaService.client.sticker.create({ data });
    }
    if (type === 'sound') {
        return this.prismaService.client.soundboardSound.create({ data });
    }
    if (type === 'profile_asset') {
        return this.prismaService.client.profileAsset.create({ data });
    }
    return { success: false, message: 'Unknown asset type' };
  }

  async updateAsset(type: string, id: string, data: any) {
    if (type === 'emoji') {
        return this.prismaService.client.customEmoji.update({ where: { id }, data });
    }
    if (type === 'sticker') {
        return this.prismaService.client.sticker.update({ where: { id }, data });
    }
    if (type === 'sound') {
        return this.prismaService.client.soundboardSound.update({ where: { id }, data });
    }
    if (type === 'profile_asset') {
        return this.prismaService.client.profileAsset.update({ where: { id }, data });
    }
    return { success: false, message: 'Unknown asset type' };
  }

  async deleteAsset(type: string, id: string) {
    if (type === 'emoji') {
        return this.prismaService.client.customEmoji.delete({ where: { id } });
    }
    if (type === 'sticker') {
        return this.prismaService.client.sticker.delete({ where: { id } });
    }
    if (type === 'sound') {
        return this.prismaService.client.soundboardSound.delete({ where: { id } });
    }
    if (type === 'profile_asset') {
        return this.prismaService.client.profileAsset.delete({ where: { id } });
    }
    return { success: false, message: 'Unknown asset type' };
  }

  async uploadFile(file: any) {
    if (!file) {
      throw new InternalServerErrorException('No file provided');
    }

    // Mocking Sanity upload
    console.log('Mock uploading to Sanity:', file.originalname);

    // Simulate a short delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      id: `mock-sanity-id-${Date.now()}`,
      url: `https://mock-sanity-url.com/${file.originalname}`,
      name: file.originalname,
      type: file.mimetype,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      assetId: `mock-asset-id-${Date.now()}`,
      metadata: {
        dimensions: { width: 800, height: 600 },
      },
    };
  }
}

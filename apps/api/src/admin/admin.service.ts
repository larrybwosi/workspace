import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SanityService } from '../common/sanity/sanity.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly sanityService: SanityService
  ) {}

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
    const query = { where: { isGlobal: true }, orderBy: { createdAt: 'desc' as const } };

    if (type === 'emoji') {
      return this.prismaService.client.customEmoji.findMany(query);
    } else if (type === 'sticker') {
      return this.prismaService.client.sticker.findMany(query);
    } else if (type === 'sound') {
      return this.prismaService.client.soundboardSound.findMany(query);
    } else if (type === 'profile_asset') {
      return this.prismaService.client.profileAsset.findMany(query);
    }
    return [];
  }

  async createAsset(type: string, data: any, userId?: string) {
    if (type === 'emoji') {
      return this.prismaService.client.customEmoji.create({
        data: {
          ...this.filterFields(data, EMOJI_FIELDS),
          ...(userId && { createdById: userId }),
        },
      });
    } else if (type === 'sticker') {
      return this.prismaService.client.sticker.create({
        data: {
          ...this.filterFields(data, STICKER_FIELDS),
          ...(userId && { createdById: userId }),
        },
      });
    } else if (type === 'sound') {
      return this.prismaService.client.soundboardSound.create({
        data: {
          ...this.filterFields(data, SOUND_FIELDS),
          ...(userId && { createdById: userId }),
        },
      });
    } else if (type === 'profile_asset') {
      return this.prismaService.client.profileAsset.create({
        data: this.filterFields(data, PROFILE_ASSET_FIELDS),
      });
    }
    throw new Error('Invalid asset type');
  }

  async updateAsset(type: string, id: string, data: any) {
    if (type === 'emoji') {
      return this.prismaService.client.customEmoji.update({
        where: { id },
        data: this.filterFields(data, EMOJI_FIELDS),
      });
    } else if (type === 'sticker') {
      return this.prismaService.client.sticker.update({
        where: { id },
        data: this.filterFields(data, STICKER_FIELDS),
      });
    } else if (type === 'sound') {
      return this.prismaService.client.soundboardSound.update({
        where: { id },
        data: this.filterFields(data, SOUND_FIELDS),
      });
    } else if (type === 'profile_asset') {
      return this.prismaService.client.profileAsset.update({
        where: { id },
        data: this.filterFields(data, PROFILE_ASSET_FIELDS),
      });
    }
    throw new Error('Invalid asset type');
  }

  async deleteAsset(type: string, id: string) {
    if (type === 'emoji') {
      await this.prismaService.client.customEmoji.delete({ where: { id } });
    } else if (type === 'sticker') {
      await this.prismaService.client.sticker.delete({ where: { id } });
    } else if (type === 'sound') {
      await this.prismaService.client.soundboardSound.delete({ where: { id } });
    } else if (type === 'profile_asset') {
      await this.prismaService.client.profileAsset.delete({ where: { id } });
    } else {
      throw new Error('Invalid asset type');
    }
    return { success: true };
  }

  async getProfileAssets() {
    return this.prismaService.client.profileAsset.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAssetStats(assetId: string, assetType: string) {
    const logs = await this.prismaService.client.assetUsageLog.findMany({
      where: {
        assetId,
        assetType: assetType === 'profile_asset' ? 'profile_asset' : (assetType as any),
      },
      orderBy: {
        usedAt: 'desc',
      },
      take: 100,
    });

    const userIds = Array.from(new Set(logs.map(l => l.userId)));
    const users = await this.prismaService.client.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true, avatar: true },
    });

    return logs.map(log => ({
      ...log,
      user: users.find(u => u.id === log.userId),
    }));
  }

  async uploadFile(file: any) {
    return this.sanityService.uploadFile(file);
  }

  private filterFields(data: any, allowedFields: string[]) {
    const filtered: any = {};
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        filtered[field] = data[field];
      }
    });
    return filtered;
  }
}

const COMMON_FIELDS = ['name', 'url', 'animated', 'isGlobal', 'rules', 'isActive', 'category', 'workspaceId'];
const EMOJI_FIELDS = [
  'name',
  'imageUrl',
  'animated',
  'isGlobal',
  'rules',
  'isActive',
  'category',
  'shortcode',
  'workspaceId',
];
const STICKER_FIELDS = COMMON_FIELDS;
const SOUND_FIELDS = [...COMMON_FIELDS, 'volume', 'emoji'];
const PROFILE_ASSET_FIELDS = [
  'name',
  'url',
  'type',
  'animated',
  'themeColors',
  'requiredRole',
  'requiredBadgeId',
  'rules',
  'isGlobal',
];

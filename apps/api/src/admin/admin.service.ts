import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/database';

@Injectable()
export class AdminService {
  async getAssets(type: string) {
    if (type === 'emoji') {
      return prisma.customEmoji.findMany({ orderBy: { createdAt: 'desc' } });
    } else if (type === 'sticker') {
      return prisma.sticker.findMany({ orderBy: { createdAt: 'desc' } });
    } else if (type === 'sound') {
      return prisma.soundboardSound.findMany({ orderBy: { createdAt: 'desc' } });
    } else if (type === 'profile_asset') {
      return prisma.profileAsset.findMany({ orderBy: { createdAt: 'desc' } });
    }
    return [];
  }

  async createAsset(type: string, data: any, userId: string) {
    if (type === 'emoji') {
      return prisma.customEmoji.create({
        data: {
          ...this.filterFields(data, EMOJI_FIELDS),
          createdById: userId,
        },
      });
    } else if (type === 'sticker') {
      return prisma.sticker.create({
        data: {
          ...this.filterFields(data, STICKER_FIELDS),
          createdById: userId,
        },
      });
    } else if (type === 'sound') {
      return prisma.soundboardSound.create({
        data: {
          ...this.filterFields(data, SOUND_FIELDS),
          createdById: userId,
        },
      });
    } else if (type === 'profile_asset') {
      return prisma.profileAsset.create({
        data: this.filterFields(data, PROFILE_ASSET_FIELDS),
      });
    }
    throw new Error('Invalid asset type');
  }

  async updateAsset(type: string, id: string, data: any) {
    if (type === 'emoji') {
      return prisma.customEmoji.update({
        where: { id },
        data: this.filterFields(data, EMOJI_FIELDS)
      });
    } else if (type === 'sticker') {
      return prisma.sticker.update({
        where: { id },
        data: this.filterFields(data, STICKER_FIELDS)
      });
    } else if (type === 'sound') {
      return prisma.soundboardSound.update({
        where: { id },
        data: this.filterFields(data, SOUND_FIELDS)
      });
    } else if (type === 'profile_asset') {
      return prisma.profileAsset.update({
        where: { id },
        data: this.filterFields(data, PROFILE_ASSET_FIELDS)
      });
    }
    throw new Error('Invalid asset type');
  }

  async deleteAsset(type: string, id: string) {
    if (type === 'emoji') {
      await prisma.customEmoji.delete({ where: { id } });
    } else if (type === 'sticker') {
      await prisma.sticker.delete({ where: { id } });
    } else if (type === 'sound') {
      await prisma.soundboardSound.delete({ where: { id } });
    } else if (type === 'profile_asset') {
      await prisma.profileAsset.delete({ where: { id } });
    } else {
      throw new Error('Invalid asset type');
    }
    return { success: true };
  }

  async getProfileAssets() {
    return prisma.profileAsset.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAssetStats(assetId: string, assetType: string) {
    const logs = await prisma.assetUsageLog.findMany({
      where: {
        assetId,
        assetType: assetType === 'profile_asset' ? 'profile_asset' : assetType as any,
      },
      orderBy: {
        usedAt: 'desc',
      },
      take: 100,
    });

    const userIds = Array.from(new Set(logs.map(l => l.userId)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true, avatar: true }
    });

    return logs.map(log => ({
      ...log,
      user: users.find(u => u.id === log.userId)
    }));
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
const EMOJI_FIELDS = ['name', 'imageUrl', 'animated', 'isGlobal', 'rules', 'isActive', 'category', 'shortcode', 'workspaceId'];
const STICKER_FIELDS = COMMON_FIELDS;
const SOUND_FIELDS = [...COMMON_FIELDS, 'volume', 'emoji'];
const PROFILE_ASSET_FIELDS = ['name', 'url', 'type', 'animated', 'themeColors', 'requiredRole', 'requiredBadgeId', 'rules', 'isGlobal'];

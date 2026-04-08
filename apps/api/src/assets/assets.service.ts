import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface AssetRules {
  requiredPlan?: string;
  requiredRole?: string;
  requiredBadgeId?: string;
  minAccountAgeDays?: number;
  minMessages?: number;
}

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async getEligibleAssets(userId: string) {
    const user = await this.prismaService.client.user.findUnique({
      where: { id: userId },
    });

    if (!user) return { emojis: [], stickers: [], sounds: [], profileAssets: [] };

    // Fetch all assets
    const [emojis, stickers, sounds, profileAssets] = await Promise.all([
      this.prismaService.client.customEmoji.findMany({ where: { isActive: true } }),
      this.prismaService.client.sticker.findMany({ where: { isActive: true } }),
      this.prismaService.client.soundboardSound.findMany({ where: { isActive: true } }),
      this.prismaService.client.profileAsset.findMany(),
    ]);

    // Filter each type by eligibility
    // For now, we return all, but mark them with 'isEligible'
    return {
      emojis: await this.filterAssets(userId, user, emojis),
      stickers: await this.filterAssets(userId, user, stickers),
      sounds: await this.filterAssets(userId, user, sounds),
      profileAssets: await this.filterAssets(userId, user, profileAssets),
    };
  }

  private async filterAssets(userId: string, user: any, assets: any[]) {
    const result = [];
    for (const asset of assets) {
      const isEligible = await this.checkEligibility(userId, user, asset.rules);
      result.push({
        ...asset,
        isEligible,
      });
    }
    return result;
  }

  async checkEligibility(userId: string, user: any, rules: any): Promise<boolean> {
    if (!rules || Object.keys(rules).length === 0) return true;

    // If user is admin, they are eligible for everything
    if (user.role === 'admin' || user.role === 'Admin') return true;

    const typedRules = rules as AssetRules;

    // 1. Plan requirement
    if (typedRules.requiredPlan && typedRules.requiredPlan !== 'free') {
      if (user.plan === 'free') return false;
      if (typedRules.requiredPlan === 'nitro' && user.plan !== 'nitro') return false;
    }

    // 2. Role requirement
    if (typedRules.requiredRole && user.role !== typedRules.requiredRole) {
      return false;
    }

    // 3. Badge requirement
    if (typedRules.requiredBadgeId) {
      const hasBadge = await this.prismaService.client.userBadgeAssignment.findUnique({
        where: {
          userId_badgeId: {
            userId,
            badgeId: typedRules.requiredBadgeId,
          },
        },
      });
      if (!hasBadge) return false;
    }

    // 4. Account age requirement
    if (typedRules.minAccountAgeDays) {
      const accountAgeInDays = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (accountAgeInDays < typedRules.minAccountAgeDays) return false;
    }

    // 5. Message count requirement
    if (typedRules.minMessages && user.messageCount < typedRules.minMessages) {
      return false;
    }

    return true;
  }
}

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

  /**
   * Retrieves all assets and evaluates user eligibility for each.
   *
   * Optimization highlights:
   * 1. Consolidates user lookup, badge assignment pre-fetching, and all 4 asset queries
   *    into a single `Promise.all` call, reducing database round-trips from (2 + N) to 1.
   * 2. Pre-fetches badge assignments into a `Set<string>` to eliminate N+1 `userBadgeAssignment`
   *    database queries during asset filtering loops, enabling O(1) in-memory badge lookups.
   */
  async getEligibleAssets(userId: string) {
    const [user, userBadges, emojis, stickers, sounds, profileAssets] = await Promise.all([
      this.prismaService.client.user.findUnique({ where: { id: userId } }),
      this.prismaService.client.userBadgeAssignment.findMany({
        where: { userId },
        select: { badgeId: true },
      }),
      this.prismaService.client.customEmoji.findMany({ where: { isActive: true } }),
      this.prismaService.client.sticker.findMany({ where: { isActive: true } }),
      this.prismaService.client.soundboardSound.findMany({ where: { isActive: true } }),
      this.prismaService.client.profileAsset.findMany(),
    ]);

    if (!user) return { emojis: [], stickers: [], sounds: [], profileAssets: [] };

    const userBadgeSet = new Set(userBadges.map((b) => b.badgeId));

    // Filter each type synchronously in memory without blocking database queries
    return {
      emojis: this.filterAssetsSync(user, emojis, userBadgeSet),
      stickers: this.filterAssetsSync(user, stickers, userBadgeSet),
      sounds: this.filterAssetsSync(user, sounds, userBadgeSet),
      profileAssets: this.filterAssetsSync(user, profileAssets, userBadgeSet),
    };
  }

  private filterAssetsSync(user: any, assets: any[], userBadgeSet: Set<string>) {
    return assets.map((asset) => ({
      ...asset,
      isEligible: this.checkEligibilitySync(user, asset.rules, userBadgeSet),
    }));
  }

  private checkEligibilitySync(user: any, rules: any, userBadgeSet?: Set<string>): boolean {
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
    if (typedRules.requiredBadgeId && userBadgeSet) {
      if (!userBadgeSet.has(typedRules.requiredBadgeId)) return false;
    }

    // 4. Account age requirement
    if (typedRules.minAccountAgeDays && user.createdAt) {
      const createdAtTime = new Date(user.createdAt).getTime();
      const accountAgeInDays = (Date.now() - createdAtTime) / (1000 * 60 * 60 * 24);
      if (accountAgeInDays < typedRules.minAccountAgeDays) return false;
    }

    // 5. Message count requirement
    if (typedRules.minMessages && user.messageCount < typedRules.minMessages) {
      return false;
    }

    return true;
  }

  async checkEligibility(userId: string, user: any, rules: any, userBadgeSet?: Set<string>): Promise<boolean> {
    if (!rules || Object.keys(rules).length === 0) return true;

    // If user is admin, they are eligible for everything
    if (user.role === 'admin' || user.role === 'Admin') return true;

    const typedRules = rules as AssetRules;

    // Fallback to database lookup if userBadgeSet is not provided for badge check
    if (typedRules.requiredBadgeId && !userBadgeSet) {
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

    return this.checkEligibilitySync(user, rules, userBadgeSet);
  }
}

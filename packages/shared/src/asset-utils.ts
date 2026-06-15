'use server';

import { prisma } from '@repo/database';

export interface AssetRules {
  requiredPlan?: string;
  requiredRole?: string;
  requiredBadgeId?: string;
  minAccountAgeDays?: number;
  minMessages?: number;
}

/**
 * Validates if a user is eligible to use a specific asset based on its rules.
 */
export async function isUserEligibleForAsset(userId: string, rules: any): Promise<boolean> {
  if (!rules || Object.keys(rules).length === 0) return true;

  const typedRules = rules as AssetRules;

  /**
   * ⚡ Performance Optimization:
   * 1. Parallelizes user lookup and badge verification to reduce sequential database round-trips.
   * 2. Uses targeted 'select' to minimize the retrieved user fields, reducing payload and memory overhead.
   * Expected impact: Reduces database latency from O(2) to O(1) when badge requirements exist.
   */
  const [user, hasBadge] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        role: true,
        messageCount: true,
        createdAt: true,
      },
    }),
    typedRules.requiredBadgeId
      ? prisma.userBadgeAssignment.findUnique({
          where: {
            userId_badgeId: {
              userId,
              badgeId: typedRules.requiredBadgeId,
            },
          },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  if (!user) return false;

  // 1. Plan requirement (e.g., 'nitro', 'nitro_basic')
  if (typedRules.requiredPlan) {
    if (user.plan === 'free') return false;
    if (typedRules.requiredPlan === 'nitro' && user.plan !== 'nitro') return false;
  }

  // 2. Role requirement
  if (typedRules.requiredRole && user.role !== typedRules.requiredRole) {
    // If it's an admin, they usually have access to everything
    if (user.role !== 'Admin') return false;
  }

  // 3. Badge requirement
  if (typedRules.requiredBadgeId && !hasBadge) {
    return false;
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

/**
 * Logs the usage of an asset and increments its usage count.
 */
export async function logAssetUsage(params: {
  assetId: string;
  assetType: 'emoji' | 'sticker' | 'sound' | 'profile_asset';
  userId: string;
  workspaceId?: string;
  metadata?: any;
}) {
  const { assetId, assetType, userId, workspaceId, metadata } = params;

  /**
   * ⚡ Performance Optimization:
   * Parallelizes log entry creation and asset usage count increment using Promise.all.
   * This reduces the total database round-trip latency by running these independent operations in parallel.
   */
  const logPromise = prisma.assetUsageLog.create({
    data: {
      assetId,
      assetType,
      userId,
      workspaceId,
      metadata,
    },
  });

  // Increment usage count in the respective table
  let updatePromise: Promise<any> | null = null;
  if (assetType === 'emoji') {
    updatePromise = prisma.customEmoji.update({
      where: { id: assetId },
      data: { usageCount: { increment: 1 } },
    });
  } else if (assetType === 'sticker') {
    updatePromise = prisma.sticker.update({
      where: { id: assetId },
      data: { usageCount: { increment: 1 } },
    });
  } else if (assetType === 'sound') {
    updatePromise = prisma.soundboardSound.update({
      where: { id: assetId },
      data: { usageCount: { increment: 1 } },
    });
  } else if (assetType === 'profile_asset') {
    updatePromise = prisma.profileAsset.update({
      where: { id: assetId },
      data: { usageCount: { increment: 1 } },
    });
  }

  try {
    if (updatePromise) {
      await Promise.all([logPromise, updatePromise]);
    } else {
      await logPromise;
    }
  } catch (error) {
    console.warn(`Error logging asset usage for ${assetType} ${assetId}:`, error);
  }
}

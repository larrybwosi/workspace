import { prisma } from "@/lib/db/prisma";

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

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return false;

  const typedRules = rules as AssetRules;

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
  if (typedRules.requiredBadgeId) {
    const hasBadge = await prisma.userBadgeAssignment.findUnique({
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

  // Create log entry
  await prisma.assetUsageLog.create({
    data: {
      assetId,
      assetType,
      userId,
      workspaceId,
      metadata,
    },
  });

  // Increment usage count in the respective table
  try {
    if (assetType === 'emoji') {
      await prisma.customEmoji.update({
        where: { id: assetId },
        data: { usageCount: { increment: 1 } },
      });
    } else if (assetType === 'sticker') {
      await prisma.sticker.update({
        where: { id: assetId },
        data: { usageCount: { increment: 1 } },
      });
    } else if (assetType === 'sound') {
      await prisma.soundboardSound.update({
        where: { id: assetId },
        data: { usageCount: { increment: 1 } },
      });
    } else if (assetType === 'profile_asset') {
      await prisma.profileAsset.update({
        where: { id: assetId },
        data: { usageCount: { increment: 1 } },
      });
    }
  } catch (error) {
    console.warn(`Could not increment usage count for ${assetType} ${assetId}:`, error);
  }
}

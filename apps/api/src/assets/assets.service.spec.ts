import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AssetsService } from './assets.service';

describe('AssetsService', () => {
  let service: AssetsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        user: {
          findUnique: vi.fn(),
        },
        userBadgeAssignment: {
          findMany: vi.fn(),
          findUnique: vi.fn(),
        },
        customEmoji: {
          findMany: vi.fn(),
        },
        sticker: {
          findMany: vi.fn(),
        },
        soundboardSound: {
          findMany: vi.fn(),
        },
        profileAsset: {
          findMany: vi.fn(),
        },
      },
    };

    service = new AssetsService(mockPrisma as any);
  });

  describe('getEligibleAssets', () => {
    it('should return empty assets if user is not found', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(null);
      mockPrisma.client.userBadgeAssignment.findMany.mockResolvedValue([]);
      mockPrisma.client.customEmoji.findMany.mockResolvedValue([]);
      mockPrisma.client.sticker.findMany.mockResolvedValue([]);
      mockPrisma.client.soundboardSound.findMany.mockResolvedValue([]);
      mockPrisma.client.profileAsset.findMany.mockResolvedValue([]);

      const result = await service.getEligibleAssets('user-1');

      expect(result).toEqual({ emojis: [], stickers: [], sounds: [], profileAssets: [] });
    });

    it('should evaluate asset eligibility using pre-fetched user badge assignments', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'user',
        plan: 'nitro',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        messageCount: 100,
      };

      const mockBadges = [{ badgeId: 'badge-vip' }];

      const mockEmojis = [
        { id: 'e1', name: 'fire', rules: { requiredBadgeId: 'badge-vip' } },
        { id: 'e2', name: 'star', rules: { requiredBadgeId: 'badge-mod' } },
      ];

      const mockStickers = [
        { id: 's1', name: 'cat', rules: { minMessages: 50 } },
      ];

      const mockSounds = [
        { id: 'snd1', name: 'applause', rules: { requiredPlan: 'nitro' } },
      ];

      const mockProfileAssets = [
        { id: 'pa1', name: 'frame1', rules: {} },
      ];

      mockPrisma.client.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.client.userBadgeAssignment.findMany.mockResolvedValue(mockBadges);
      mockPrisma.client.customEmoji.findMany.mockResolvedValue(mockEmojis);
      mockPrisma.client.sticker.findMany.mockResolvedValue(mockStickers);
      mockPrisma.client.soundboardSound.findMany.mockResolvedValue(mockSounds);
      mockPrisma.client.profileAsset.findMany.mockResolvedValue(mockProfileAssets);

      const result = await service.getEligibleAssets('user-1');

      expect(result.emojis).toEqual([
        { id: 'e1', name: 'fire', rules: { requiredBadgeId: 'badge-vip' }, isEligible: true },
        { id: 'e2', name: 'star', rules: { requiredBadgeId: 'badge-mod' }, isEligible: false },
      ]);
      expect(result.stickers).toEqual([
        { id: 's1', name: 'cat', rules: { minMessages: 50 }, isEligible: true },
      ]);
      expect(result.sounds).toEqual([
        { id: 'snd1', name: 'applause', rules: { requiredPlan: 'nitro' }, isEligible: true },
      ]);
      expect(result.profileAssets).toEqual([
        { id: 'pa1', name: 'frame1', rules: {}, isEligible: true },
      ]);

      // Verify N+1 database badge lookups were avoided
      expect(mockPrisma.client.userBadgeAssignment.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('checkEligibility', () => {
    const mockUser = {
      id: 'user-1',
      role: 'user',
      plan: 'free',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      messageCount: 20,
    };

    it('should return true if rules are empty or missing', async () => {
      expect(await service.checkEligibility('user-1', mockUser, null)).toBe(true);
      expect(await service.checkEligibility('user-1', mockUser, {})).toBe(true);
    });

    it('should return true if user is admin regardless of rules', async () => {
      const adminUser = { ...mockUser, role: 'admin' };
      const strictRules = { requiredPlan: 'nitro', requiredRole: 'mod', minMessages: 1000 };
      expect(await service.checkEligibility('user-1', adminUser, strictRules)).toBe(true);
    });

    it('should check plan requirements', async () => {
      expect(await service.checkEligibility('user-1', mockUser, { requiredPlan: 'free' })).toBe(true);
      expect(await service.checkEligibility('user-1', mockUser, { requiredPlan: 'nitro' })).toBe(false);

      const nitroUser = { ...mockUser, plan: 'nitro' };
      expect(await service.checkEligibility('user-1', nitroUser, { requiredPlan: 'nitro' })).toBe(true);
    });

    it('should check role requirements', async () => {
      expect(await service.checkEligibility('user-1', mockUser, { requiredRole: 'moderator' })).toBe(false);
      const modUser = { ...mockUser, role: 'moderator' };
      expect(await service.checkEligibility('user-1', modUser, { requiredRole: 'moderator' })).toBe(true);
    });

    it('should check account age requirements', async () => {
      expect(await service.checkEligibility('user-1', mockUser, { minAccountAgeDays: 5 })).toBe(true);
      expect(await service.checkEligibility('user-1', mockUser, { minAccountAgeDays: 20 })).toBe(false);
    });

    it('should check message count requirements', async () => {
      expect(await service.checkEligibility('user-1', mockUser, { minMessages: 10 })).toBe(true);
      expect(await service.checkEligibility('user-1', mockUser, { minMessages: 50 })).toBe(false);
    });

    it('should fallback to DB badge lookup when userBadgeSet is not provided', async () => {
      mockPrisma.client.userBadgeAssignment.findUnique.mockResolvedValue({ userId: 'user-1', badgeId: 'badge-1' });
      expect(await service.checkEligibility('user-1', mockUser, { requiredBadgeId: 'badge-1' })).toBe(true);

      mockPrisma.client.userBadgeAssignment.findUnique.mockResolvedValue(null);
      expect(await service.checkEligibility('user-1', mockUser, { requiredBadgeId: 'badge-2' })).toBe(false);
    });
  });
});

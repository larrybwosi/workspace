import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from '../auth/admin.guard';
import { AuthGuard } from '../auth/auth.guard';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: AdminService;

  const mockAdminService = {
    getStats: vi.fn(),
    getMembers: vi.fn(),
    updateMemberRole: vi.fn(),
    getAssets: vi.fn(),
    createAsset: vi.fn(),
    updateAsset: vi.fn(),
    deleteAsset: vi.fn(),
    getProfileAssets: vi.fn(),
    getAssetStats: vi.fn(),
    uploadFile: vi.fn(),
  };

  const mockAdminUser = { id: 'admin-1', name: 'Admin', role: 'admin' } as any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updateMemberRole', () => {
    it('should successfully update another user role', async () => {
      mockAdminService.updateMemberRole.mockResolvedValue({ id: 'user-2', role: 'moderator' });

      const result = await controller.updateMemberRole(mockAdminUser, 'user-2', { role: 'moderator' });

      expect(result).toEqual({ id: 'user-2', role: 'moderator' });
      expect(mockAdminService.updateMemberRole).toHaveBeenCalledWith('user-2', 'moderator');
    });

    it('should allow admin to keep their own admin role', async () => {
      mockAdminService.updateMemberRole.mockResolvedValue({ id: 'admin-1', role: 'admin' });

      const result = await controller.updateMemberRole(mockAdminUser, 'admin-1', { role: 'admin' });

      expect(result).toEqual({ id: 'admin-1', role: 'admin' });
      expect(mockAdminService.updateMemberRole).toHaveBeenCalledWith('admin-1', 'admin');
    });

    it('should throw BadRequestException when admin attempts to demote their own account', async () => {
      await expect(
        controller.updateMemberRole(mockAdminUser, 'admin-1', { role: 'user' })
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.updateMemberRole(mockAdminUser, 'admin-1', { role: 'user' })
      ).rejects.toThrow('Admins cannot demote their own account');

      expect(mockAdminService.updateMemberRole).not.toHaveBeenCalled();
    });
  });

  describe('createAsset', () => {
    it('should create an asset with validated dto payload', async () => {
      const dto = { type: 'emoji', data: { name: 'parrot', url: 'https://example.com/parrot.gif' } };
      mockAdminService.createAsset.mockResolvedValue({ id: 'asset-1', ...dto.data });

      const result = await controller.createAsset(dto);

      expect(result).toEqual({ id: 'asset-1', ...dto.data });
      expect(mockAdminService.createAsset).toHaveBeenCalledWith('emoji', dto.data);
    });
  });

  describe('updateAsset', () => {
    it('should update an asset with validated dto payload', async () => {
      const dto = { type: 'emoji', id: 'asset-1', data: { name: 'updated_parrot' } };
      mockAdminService.updateAsset.mockResolvedValue({ id: 'asset-1', ...dto.data });

      const result = await controller.updateAsset(dto);

      expect(result).toEqual({ id: 'asset-1', ...dto.data });
      expect(mockAdminService.updateAsset).toHaveBeenCalledWith('emoji', 'asset-1', dto.data);
    });
  });
});

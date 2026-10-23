import { describe, it, expect, beforeEach, vi } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { V10EnterpriseController, V10CreateDepartmentAnnouncementDto } from './enterprise.controller';
import { V10EnterpriseService } from './enterprise.service';

describe('V10EnterpriseController', () => {
  let controller: V10EnterpriseController;
  let service: V10EnterpriseService;

  const mockBot = {
    id: 'bot_101',
    name: 'EnterpriseBot',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = {
      createAnnouncement: vi.fn(),
    } as unknown as V10EnterpriseService;

    controller = new V10EnterpriseController(service);
  });

  describe('createAnnouncement', () => {
    it('should delegate announcement creation to V10EnterpriseService', async () => {
      const mockResult = {
        id: 'announcement_1',
        departmentId: 'dept_123',
        title: 'System Maintenance',
        content: 'Server update scheduled at midnight.',
        priority: 'high',
      };

      (service.createAnnouncement as any).mockResolvedValue(mockResult);

      const dto: V10CreateDepartmentAnnouncementDto = {
        title: 'System Maintenance',
        content: 'Server update scheduled at midnight.',
        priority: 'high',
      };

      const result = await controller.createAnnouncement(mockBot, 'dept_123', dto);

      expect(service.createAnnouncement).toHaveBeenCalledWith(mockBot, 'dept_123', dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('V10CreateDepartmentAnnouncementDto validation', () => {
    it('should validate successfully for valid input payload', async () => {
      const dto = plainToInstance(V10CreateDepartmentAnnouncementDto, {
        title: 'Q3 All Hands',
        content: 'Meeting in main auditorium.',
        priority: 'urgent',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate successfully when priority is omitted (optional field)', async () => {
      const dto = plainToInstance(V10CreateDepartmentAnnouncementDto, {
        title: 'Team Outing',
        content: 'Friday picnic details.',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when title is missing or empty', async () => {
      const dto = plainToInstance(V10CreateDepartmentAnnouncementDto, {
        title: '',
        content: 'Some content',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'title')).toBe(true);
    });

    it('should fail validation when content is missing or empty', async () => {
      const dto = plainToInstance(V10CreateDepartmentAnnouncementDto, {
        title: 'Important Update',
        content: '',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'content')).toBe(true);
    });

    it('should fail validation when priority is invalid', async () => {
      const dto = plainToInstance(V10CreateDepartmentAnnouncementDto, {
        title: 'Security Alert',
        content: 'Critical patch required.',
        priority: 'super_high',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'priority')).toBe(true);
    });

    it('should fail validation when title or content are non-string types', async () => {
      const dto = plainToInstance(V10CreateDepartmentAnnouncementDto, {
        title: { invalid: true },
        content: 12345,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

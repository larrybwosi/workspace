import { describe, it, expect, beforeEach, vi } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { V10ApplicationsController, V10CreateApplicationCommandDto } from './applications.controller';
import { V10ApplicationsService } from './applications.service';

describe('V10ApplicationsController', () => {
  let controller: V10ApplicationsController;
  let service: V10ApplicationsService;

  const mockBot = {
    id: 'bot_123',
    name: 'Test Bot',
    botApplication: {
      id: 'app_123',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = {
      getCommands: vi.fn(),
      createCommand: vi.fn(),
      getGuildCommands: vi.fn(),
      createGuildCommand: vi.fn(),
    } as unknown as V10ApplicationsService;

    controller = new V10ApplicationsController(service);
  });

  describe('getCommands', () => {
    it('should delegate getCommands to V10ApplicationsService', async () => {
      const mockCommands = [
        { id: 'cmd_1', name: 'ping', description: 'Ping command', options: [], type: 1 },
      ];
      (service.getCommands as any).mockResolvedValue(mockCommands);

      const result = await controller.getCommands(mockBot, 'app_123');

      expect(service.getCommands).toHaveBeenCalledWith(mockBot, 'app_123');
      expect(result).toEqual(mockCommands);
    });
  });

  describe('createCommand', () => {
    it('should delegate createCommand to V10ApplicationsService', async () => {
      const dto: V10CreateApplicationCommandDto = {
        name: 'ping',
        description: 'Ping command',
        options: [],
        type: 1,
      };
      const mockCreatedCommand = { id: 'cmd_1', ...dto };
      (service.createCommand as any).mockResolvedValue(mockCreatedCommand);

      const result = await controller.createCommand(mockBot, 'app_123', dto);

      expect(service.createCommand).toHaveBeenCalledWith(mockBot, 'app_123', dto);
      expect(result).toEqual(mockCreatedCommand);
    });
  });

  describe('getGuildCommands', () => {
    it('should delegate getGuildCommands to V10ApplicationsService', async () => {
      const mockGuildCommands = [
        { id: 'cmd_guild_1', name: 'guildping', description: 'Guild ping', options: [], type: 1 },
      ];
      (service.getGuildCommands as any).mockResolvedValue(mockGuildCommands);

      const result = await controller.getGuildCommands(mockBot, 'app_123', 'guild_1');

      expect(service.getGuildCommands).toHaveBeenCalledWith(mockBot, 'app_123', 'guild_1');
      expect(result).toEqual(mockGuildCommands);
    });
  });

  describe('createGuildCommand', () => {
    it('should delegate createGuildCommand to V10ApplicationsService', async () => {
      const dto: V10CreateApplicationCommandDto = {
        name: 'guildping',
        description: 'Guild ping',
      };
      const mockCreatedCommand = { id: 'cmd_guild_1', ...dto };
      (service.createGuildCommand as any).mockResolvedValue(mockCreatedCommand);

      const result = await controller.createGuildCommand(mockBot, 'app_123', 'guild_1', dto);

      expect(service.createGuildCommand).toHaveBeenCalledWith(mockBot, 'app_123', 'guild_1', dto);
      expect(result).toEqual(mockCreatedCommand);
    });
  });

  describe('V10CreateApplicationCommandDto validation', () => {
    it('should validate successfully for valid input payload', async () => {
      const dto = plainToInstance(V10CreateApplicationCommandDto, {
        name: 'ping',
        description: 'Ping command',
        options: [{ name: 'target', type: 3 }],
        type: 1,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate successfully when optional fields (options, type) are omitted', async () => {
      const dto = plainToInstance(V10CreateApplicationCommandDto, {
        name: 'help',
        description: 'Help command',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when name is missing or empty', async () => {
      const dto = plainToInstance(V10CreateApplicationCommandDto, {
        name: '',
        description: 'Description without name',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('should fail validation when description is missing or empty', async () => {
      const dto = plainToInstance(V10CreateApplicationCommandDto, {
        name: 'ping',
        description: '',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'description')).toBe(true);
    });

    it('should fail validation when type is not an integer', async () => {
      const dto = plainToInstance(V10CreateApplicationCommandDto, {
        name: 'ping',
        description: 'Ping command',
        type: 'invalid_type',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'type')).toBe(true);
    });

    it('should fail validation when options is not an array', async () => {
      const dto = plainToInstance(V10CreateApplicationCommandDto, {
        name: 'ping',
        description: 'Ping command',
        options: 'not_an_array',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'options')).toBe(true);
    });
  });
});

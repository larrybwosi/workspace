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
    name: 'CommandBot',
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
    it('should delegate global command retrieval to service', async () => {
      const mockResult = [{ id: 'cmd_1', name: 'ping', description: 'Ping command' }];
      (service.getCommands as any).mockResolvedValue(mockResult);

      const result = await controller.getCommands(mockBot, 'app_123');

      expect(service.getCommands).toHaveBeenCalledWith(mockBot, 'app_123');
      expect(result).toEqual(mockResult);
    });
  });

  describe('createCommand', () => {
    it('should delegate command creation to service', async () => {
      const mockResult = {
        id: 'cmd_1',
        application_id: 'app_123',
        name: 'ping',
        description: 'Ping command',
        options: [],
        type: 1,
      };
      (service.createCommand as any).mockResolvedValue(mockResult);

      const dto: V10CreateApplicationCommandDto = {
        name: 'ping',
        description: 'Ping command',
        options: [],
        type: 1,
      };

      const result = await controller.createCommand(mockBot, 'app_123', dto);

      expect(service.createCommand).toHaveBeenCalledWith(mockBot, 'app_123', dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getGuildCommands', () => {
    it('should delegate guild command retrieval to service', async () => {
      const mockResult = [{ id: 'cmd_guild_1', name: 'guildping', description: 'Guild ping' }];
      (service.getGuildCommands as any).mockResolvedValue(mockResult);

      const result = await controller.getGuildCommands(mockBot, 'app_123', 'guild_1');

      expect(service.getGuildCommands).toHaveBeenCalledWith(mockBot, 'app_123', 'guild_1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('createGuildCommand', () => {
    it('should delegate guild command creation to service', async () => {
      const mockResult = {
        id: 'cmd_guild_1',
        application_id: 'app_123',
        name: 'guildping',
        description: 'Guild Ping',
        options: [],
        guild_id: 'guild_1',
        type: 1,
      };
      (service.createGuildCommand as any).mockResolvedValue(mockResult);

      const dto: V10CreateApplicationCommandDto = {
        name: 'guildping',
        description: 'Guild Ping',
        options: [],
        type: 1,
      };

      const result = await controller.createGuildCommand(mockBot, 'app_123', 'guild_1', dto);

      expect(service.createGuildCommand).toHaveBeenCalledWith(mockBot, 'app_123', 'guild_1', dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('V10CreateApplicationCommandDto validation', () => {
    it('should validate successfully for a complete valid payload', async () => {
      const dto = plainToInstance(V10CreateApplicationCommandDto, {
        name: 'echo',
        description: 'Echoes back text',
        options: [{ name: 'message', description: 'Text to echo', type: 3, required: true }],
        type: 1,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate successfully when optional fields are omitted', async () => {
      const dto = plainToInstance(V10CreateApplicationCommandDto, {
        name: 'ping',
        description: 'Ping command',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when name is missing or empty', async () => {
      const dto = plainToInstance(V10CreateApplicationCommandDto, {
        name: '',
        description: 'Ping command',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'name')).toBe(true);
    });

    it('should fail validation when description is missing or empty', async () => {
      const dto = plainToInstance(V10CreateApplicationCommandDto, {
        name: 'ping',
        description: '',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'description')).toBe(true);
    });

    it('should fail validation when options is not an array', async () => {
      const dto = plainToInstance(V10CreateApplicationCommandDto, {
        name: 'ping',
        description: 'Ping command',
        options: 'invalid-options',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'options')).toBe(true);
    });

    it('should fail validation when type is not an integer', async () => {
      const dto = plainToInstance(V10CreateApplicationCommandDto, {
        name: 'ping',
        description: 'Ping command',
        type: 'invalid-type',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'type')).toBe(true);
    });
  });
});

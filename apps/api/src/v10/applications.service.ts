import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { prisma } from '@repo/database';

@Injectable()
export class V10ApplicationsService {
  async getCommands(bot: any, applicationId: string) {
    if (bot.botApplication?.id !== applicationId) {
      throw new ForbiddenException('Forbidden');
    }

    const commands = await prisma.botCommand.findMany({
      where: { applicationId, guildId: null },
    });

    return commands.map((cmd) => ({
      id: cmd.id,
      application_id: cmd.applicationId,
      name: cmd.name,
      description: cmd.description,
      options: cmd.options || [],
      type: cmd.type,
    }));
  }

  async createCommand(bot: any, applicationId: string, data: any) {
    if (bot.botApplication?.id !== applicationId) {
      throw new ForbiddenException('Forbidden');
    }

    const { name, description, options, type = 1 } = data;

    if (!name || !description) {
      throw new BadRequestException('Missing name or description');
    }

    const command = await prisma.botCommand.upsert({
      where: {
        applicationId_name_guildId: {
          applicationId,
          name,
          guildId: null,
        },
      },
      update: {
        description,
        options: options || [],
        type,
      },
      create: {
        applicationId,
        name,
        description,
        options: options || [],
        type,
        guildId: null,
      },
    });

    return {
      id: command.id,
      application_id: command.applicationId,
      name: command.name,
      description: command.description,
      options: command.options || [],
      type: command.type,
    };
  }

  async getGuildCommands(bot: any, applicationId: string, guildId: string) {
    if (bot.botApplication?.id !== applicationId) {
      throw new ForbiddenException('Forbidden');
    }

    const commands = await prisma.botCommand.findMany({
      where: { applicationId, guildId },
    });

    return commands.map((cmd) => ({
      id: cmd.id,
      application_id: cmd.applicationId,
      name: cmd.name,
      description: cmd.description,
      options: cmd.options || [],
      guild_id: cmd.guildId,
      type: cmd.type,
    }));
  }

  async createGuildCommand(bot: any, applicationId: string, guildId: string, data: any) {
    if (bot.botApplication?.id !== applicationId) {
      throw new ForbiddenException('Forbidden');
    }

    const { name, description, options, type = 1 } = data;

    if (!name || !description) {
      throw new BadRequestException('Missing name or description');
    }

    const command = await prisma.botCommand.upsert({
      where: {
        applicationId_name_guildId: {
          applicationId,
          name,
          guildId,
        },
      },
      update: {
        description,
        options: options || [],
        type,
      },
      create: {
        applicationId,
        name,
        description,
        options: options || [],
        type,
        guildId,
      },
    });

    return {
      id: command.id,
      application_id: command.applicationId,
      name: command.name,
      description: command.description,
      options: command.options || [],
      guild_id: command.guildId,
      type: command.type,
    };
  }
}

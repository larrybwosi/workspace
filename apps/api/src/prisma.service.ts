import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// 1. Import PrismaClient type from your db package
import { prisma, type PrismaClient } from '@repo/database';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  // 2. Add the explicit return type annotation here
  get client(): PrismaClient {
    return prisma;
  }

  async onModuleInit() {
    await prisma.$connect();
  }
  async onModuleDestroy() {
    await prisma.$disconnect();
  }
}

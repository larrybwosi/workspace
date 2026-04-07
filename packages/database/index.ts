import { PrismaClient } from './src/generated';
import { PrismaPg } from '@prisma/adapter-pg';

export * from './src/generated';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public'
});

const prisma = new PrismaClient({ adapter });
export { prisma };

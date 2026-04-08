import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from './src/generated/index.js';
import { PrismaPg } from '@prisma/adapter-pg';

config({ path: resolve(process.cwd(), '../../.env') });

export * from './src/generated/index.js';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public'
});

const prisma = new PrismaClient({ adapter });
export { prisma };

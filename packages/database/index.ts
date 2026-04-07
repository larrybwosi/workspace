import { PrismaClient } from './client'
export * from './client'
const prisma = new PrismaClient()
export { prisma }

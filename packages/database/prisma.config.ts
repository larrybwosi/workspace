import { config } from 'dotenv';
import { resolve } from 'path';
import { defineConfig, env } from 'prisma/config';

// Load .env from various possible locations
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '../../.env') });

const databaseUrl = process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // In Prisma v7, using process.env directly avoids the strict check of env()
    // during configuration loading if the variable is missing.
    url: databaseUrl,
  },
  migrations: {
    path: 'prisma/migrations',
  },
});

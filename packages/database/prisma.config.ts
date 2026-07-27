import { config } from 'dotenv';
import path from 'path';
import { defineConfig } from 'prisma/config';

config({
  path: path.resolve(__dirname, '../../.env'),
  debug: false,
  quiet: true,
});

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    path: 'prisma/migrations',
  },
});

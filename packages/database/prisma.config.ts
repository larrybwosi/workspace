import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

const databaseUrl =
  env('DATABASE_URL') || 'postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    path: 'prisma/migrations',
  },
});

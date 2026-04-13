import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@repo/shared/server': path.resolve(__dirname, '../../packages/shared/src/server.ts'),
      '@repo/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@repo/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
      '@repo/database': path.resolve(__dirname, '../../packages/database/index.ts'),
    },
    include: ['src/**/*.spec.ts'],
  },
});

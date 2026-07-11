import { defineConfig } from 'vitest/config';
import path from 'path';
import swc from 'unplugin-swc';

export default defineConfig({
  plugins: [
    swc.vite({
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@repo/shared/server': path.resolve(__dirname, '../../packages/shared/src/server.ts'),
      '@repo/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@repo/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
      '@repo/database': path.resolve(__dirname, '../../packages/database/index.ts'),
    },
    include: ['src/**/*.spec.ts'],
  },
});

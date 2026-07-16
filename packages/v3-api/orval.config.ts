import { defineConfig } from 'orval';

export default defineConfig({
  v3Client: {
    input: '../../apps/api/openapi.json',
    output: {
      target: './src/generated/v3-client.ts',
      client: 'react-query',
      mode: 'single',
      override: {
        mutator: {
          path: './src/custom-instance.ts',
          name: 'customInstance',
        },
      },
    },
  },
  v3Server: {
    input: '../../apps/api/openapi.json',
    output: {
      target: './src/generated/v3-server.ts',
      client: 'axios',
      mode: 'single',
      override: {
        mutator: {
          path: './src/custom-instance.ts',
          name: 'customInstance',
        },
      },
    },
  },
});

import { defineConfig } from 'orval';

export default defineConfig({
  v3: {
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
});

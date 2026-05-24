import { execSync } from 'child_process';

export default async function setup() {
  if (process.env.DATABASE_URL) {
    try {
      console.log('Global Setup: Pushing database schema...');
      // We use pnpm from the root to ensure all environment variables and paths are handled correctly
      execSync(`pnpm --filter @repo/database db:push`, {
        stdio: 'inherit',
        env: { ...process.env },
      });
      console.log('Global Setup: Database schema pushed successfully.');
    } catch (e) {
      console.error('Global Setup: Failed to push schema:', e);
    }
  } else {
    console.warn('Global Setup: DATABASE_URL not set, skipping schema push.');
  }
}

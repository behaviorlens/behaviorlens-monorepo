// End-to-end tests against the running stack (docker compose up).
// Run with: npm run test:e2e
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.mjs',
  timeout: 120_000,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.BL_WEB_URL || 'http://localhost:5173',
    viewport: { width: 1440, height: 900 }
  }
});

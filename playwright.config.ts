import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'https://ufsl-bracket-test.vercel.app',
    headless: true,
    viewport: { width: 390, height: 844 },
    storageState: 'e2e/auth.json',
    screenshot: 'only-on-failure',
  },
  timeout: 30000,
  retries: 1,
})

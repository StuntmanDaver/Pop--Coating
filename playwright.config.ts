import { defineConfig, devices } from '@playwright/test'

// Wave-1 E2E config — Chromium only. Add multi-browser/mobile matrices later.
//
// baseURL precedence:
//   - E2E_BASE_URL env var (CI / non-default ports / app.localhost subdomain)
//   - http://localhost:3000 (dev fallback; office form renders because the host
//     does not start with "track.", per src/app/sign-in/page.tsx)
//
// Auth credentials:
//   - E2E_STAFF_EMAIL / E2E_STAFF_PASSWORD env vars (see fixtures/auth.ts)
//   - Test fallbacks intentionally do not match seed defaults — set the env vars
//     for local dev or override in fixtures/auth.ts.

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})

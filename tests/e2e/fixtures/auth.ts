import { test as base, type Page } from '@playwright/test'

// Office staff sign-in fixture.
//
// The /sign-in page renders one of two forms based on the request `host`:
//   - host starts with "track." → portal magic-link form
//   - else → office email/password form (this fixture targets this case)
//
// Set E2E_BASE_URL in playwright.config.ts (or env) if you need the explicit
// `app.localhost:3000` host header to match production routing.
//
// On successful office sign-in, the action redirects to "/" which the
// authenticated office shell forwards to "/dashboard".

const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL ?? 'admin@example.com'
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD ?? 'password123'

export async function staffLogin(page: Page): Promise<void> {
  await page.goto('/sign-in')
  // The page may render either form depending on host; assert we got the office
  // form before filling fields so a misconfigured baseURL fails loudly.
  await page.getByLabel('Email').fill(STAFF_EMAIL)
  await page.getByLabel('Password').fill(STAFF_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL('**/dashboard')
}

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await staffLogin(page)
    await use(page)
  },
})

export { expect } from '@playwright/test'

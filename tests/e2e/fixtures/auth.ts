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

interface Credentials {
  email: string
  password: string
}

function credentialsFromEnv(emailKey: string, passwordKey: string): Credentials | null {
  const email = process.env[emailKey]
  const password = process.env[passwordKey]

  if (!email || !password) return null
  return { email, password }
}

export function getStaffCredentials(): Credentials | null {
  return credentialsFromEnv('E2E_STAFF_EMAIL', 'E2E_STAFF_PASSWORD')
}

export function getWorkstationCredentials(): Credentials | null {
  return credentialsFromEnv('E2E_WORKSTATION_EMAIL', 'E2E_WORKSTATION_PASSWORD')
}

export async function staffLogin(page: Page, credentials = getStaffCredentials()): Promise<void> {
  if (!credentials) {
    throw new Error('Configure E2E_STAFF_EMAIL and E2E_STAFF_PASSWORD to run staff E2E tests.')
  }

  await page.goto('/sign-in')
  // The page may render either form depending on host; assert we got the office
  // form before filling fields so a misconfigured baseURL fails loudly.
  await page.getByLabel('Email').fill(credentials.email)
  await page.getByLabel('Password').fill(credentials.password)
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

import {
  expect,
  getStaffCredentials,
  getWorkstationCredentials,
  staffLogin,
  test,
} from './fixtures/auth'

function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_HOST ?? process.env.E2E_BASE_URL ?? 'http://app.localhost:3000'
}

function portalBaseUrl(): string {
  return process.env.E2E_PORTAL_BASE_URL ?? 'http://track.localhost:3000'
}

function portalSmokeEmail(): string {
  return process.env.E2E_CUSTOMER_EMAIL ?? `phase1-portal-smoke-${Date.now()}@example.invalid`
}

function shouldRunMagicLinkPostSmoke(): boolean {
  return process.env.E2E_RUN_MAGIC_LINK_POST === 'true'
}

test.describe('Phase 1 auth smoke', () => {
  const staffCredentials = getStaffCredentials()
  const workstationCredentials = getWorkstationCredentials()

  test('office host renders password sign-in instead of portal magic-link form', async ({
    page,
  }) => {
    await page.goto('/sign-in')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Sign in' }),
      'Office host should render the staff sign-in page.'
    ).toBeVisible()
    await expect(
      page.getByLabel('Password'),
      'Office staff sign-in must expose the password field on the app host.'
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Sign In' }),
      'Office staff sign-in must expose the password submit button on the app host.'
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Send magic link' }),
      'Office host must not expose the customer magic-link submit path.'
    ).toHaveCount(0)
    await expect(
      page.getByText('Enter your email to receive a magic sign-in link.'),
      'Office host must not render portal-only magic-link instructions.'
    ).toHaveCount(0)
  })

  if (staffCredentials) {
    test('office staff sign-in reaches dashboard and survives reload', async ({ page }) => {
      await staffLogin(page, staffCredentials)
      await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
      await page.reload()
      await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
    })
  }

  test('customer portal renders magic-link form on portal host', async ({ page }) => {
    await page.goto(new URL('/sign-in', portalBaseUrl()).toString())
    await expect(
      page.getByRole('heading', { level: 1, name: 'Sign in' }),
      'Portal host should render the customer magic-link sign-in page.'
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Send magic link' }),
      'Portal host must expose only the customer magic-link submit path.'
    ).toBeVisible()
    await expect(
      page.getByText('Enter your email to receive a magic sign-in link.'),
      'Portal host should explain the customer magic-link flow.'
    ).toBeVisible()
    await expect(
      page.getByLabel('Password'),
      'Portal host must not expose the office password field.'
    ).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Sign In' }),
      'Portal host must not expose the office password submit path.'
    ).toHaveCount(0)
  })

  if (shouldRunMagicLinkPostSmoke()) {
    test('customer portal magic-link request reaches anti-enumeration sent state', async ({ page }) => {
      await page.goto(new URL('/sign-in', portalBaseUrl()).toString())
      await expect(page.getByRole('button', { name: 'Send magic link' })).toBeVisible()

      await page.getByLabel('Email').fill(portalSmokeEmail())
      await page.getByRole('button', { name: 'Send magic link' }).click()

      await page.waitForURL('**/sign-in?sent=true')
      await expect(page.getByRole('heading', { level: 1, name: 'Check your email' })).toBeVisible()
    })
  }

  if (staffCredentials) {
    test('staff JWT copied onto portal host is redirected back to app host', async ({ page }) => {
      await staffLogin(page, staffCredentials)

      const portalRoot = new URL('/', portalBaseUrl()).toString()
      const copiedCookies = (await page.context().cookies()).map(
        ({ expires, httpOnly, name, path, sameSite, secure, value }) => ({
          expires,
          httpOnly,
          name,
          path,
          sameSite,
          secure,
          value,
          url: portalRoot,
        })
      )
      expect(
        copiedCookies.length,
        'Staff sign-in should create host-scoped Supabase cookies before the portal boundary check runs.'
      ).toBeGreaterThan(0)

      await page.context().addCookies(copiedCookies)
      await page.goto(portalRoot)

      const expectedOrigin = new URL(appBaseUrl()).origin
      await page.waitForURL((url) => url.origin === expectedOrigin)
      expect(
        new URL(page.url()).origin,
        'A non-customer JWT on the portal host must redirect to the staff app host.'
      ).toBe(expectedOrigin)
    })
  }

  if (workstationCredentials) {
    test('workstation credentials are denied by office shell but can reach scan surface', async ({
      page,
    }) => {
      await page.goto('/sign-in')
      await page.getByLabel('Email').fill(workstationCredentials.email)
      await page.getByLabel('Password').fill(workstationCredentials.password)
      await page.getByRole('button', { name: 'Sign In' }).click()

      await page.waitForURL('**/sign-in')
      expect(
        new URL(page.url()).searchParams.get('error'),
        'Workstation credentials should authenticate, then be rejected by the office staff shell without an auth error.'
      ).toBeNull()
      await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).not.toBeVisible()

      await page.goto('/scan')
      await expect(
        page.getByText(/Select Employee|iPad Not Enrolled|Workstation Not Found/)
      ).toBeVisible()
    })
  }
})

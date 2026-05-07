import { test, expect } from './fixtures/auth'

// Wave-1 Companies CRUD lifecycle:
//   list -> create -> detail from list -> edit
//
// The archive action currently has no office UI control, so this spec covers
// the user-reachable browser contract without calling server actions directly.

interface CompanyState {
  id: string
  name: string
  email: string
  phone: string
}

const RUN_ID = Date.now().toString(36)
const sharedState: CompanyState = {
  id: '',
  name: `E2E Company ${RUN_ID}`,
  email: `ap-${RUN_ID}@example.test`,
  phone: `555-${RUN_ID.slice(-4).padStart(4, '0')}`,
}

test.describe.serial('Companies CRUD', () => {
  test('can view companies list', async ({ authenticatedPage: page }) => {
    await page.goto('/companies')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Companies' }),
      'Companies list should render for authenticated office staff'
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'New company' }),
      'Companies list should expose the create-company entry point'
    ).toBeVisible()
  })

  test('can create a company', async ({ authenticatedPage: page }) => {
    await page.goto('/companies/new')

    await expect(
      page.getByRole('heading', { level: 1, name: 'New company' }),
      'New company page should render before filling the form'
    ).toBeVisible()

    await page.locator('input[name="name"]').fill(sharedState.name)
    await page.locator('input[name="phone"]').fill(sharedState.phone)
    await page.locator('input[name="email"]').fill(sharedState.email)
    await page.locator('input[name="payment_terms"]').fill('Net 21')
    await page.locator('input[name="customer_since"]').fill('2026-05-01')
    await page.locator('input[name="shipping_address"]').fill('1200 Test Fixture Way')
    await page.locator('input[name="shipping_city"]').fill('Pittsburgh')
    await page.locator('input[name="shipping_state"]').fill('PA')
    await page.locator('input[name="shipping_zip"]').fill('15222')
    await page.locator('textarea[name="notes"]').fill('Created by Playwright companies CRUD coverage.')

    await page.getByRole('button', { name: 'Create company' }).click()

    await page.waitForURL(/\/companies\/[0-9a-f-]{36}$/i)
    const companyId = new URL(page.url()).pathname.split('/').pop() ?? ''
    expect(
      companyId,
      'Create company should redirect to the new company detail route with a UUID id'
    ).toMatch(/^[0-9a-f-]{36}$/i)
    sharedState.id = companyId

    await expect(
      page.getByRole('heading', { level: 1, name: sharedState.name }),
      'Company detail should show the newly-created company name'
    ).toBeVisible()
    await expect(
      page.getByText(sharedState.email),
      'Company detail should show the newly-created billing email'
    ).toBeVisible()
    await expect(
      page.getByText('1200 Test Fixture Way'),
      'Company detail should show the newly-created shipping address'
    ).toBeVisible()
  })

  test('can view company detail from the list', async ({ authenticatedPage: page }) => {
    expect(
      sharedState.id,
      'Create test should set a company id before list-to-detail navigation runs'
    ).toMatch(/^[0-9a-f-]{36}$/i)

    await page.goto(`/companies?q=${encodeURIComponent(sharedState.name)}`)
    const companyLink = page.getByRole('link', { name: sharedState.name }).first()
    await expect(
      companyLink,
      'Companies search should return the company created earlier in this run'
    ).toBeVisible()
    await companyLink.click()

    await page.waitForURL(`**/companies/${sharedState.id}`)
    await expect(
      page.getByRole('heading', { level: 1, name: sharedState.name }),
      'Company detail should be reachable from the filtered list'
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Edit' }),
      'Company detail should expose the edit entry point'
    ).toBeVisible()
  })

  test('can edit a company', async ({ authenticatedPage: page }) => {
    expect(
      sharedState.id,
      'Create test should set a company id before edit runs'
    ).toMatch(/^[0-9a-f-]{36}$/i)

    await page.goto(`/companies/${sharedState.id}/edit`)

    const newName = `${sharedState.name} Edited`
    const newEmail = `ap-edited-${RUN_ID}@example.test`
    await page.locator('input[name="name"]').fill(newName)
    await page.locator('input[name="email"]').fill(newEmail)
    await page.locator('input[name="payment_terms"]').fill('Net 30')
    await page.locator('input[name="billing_address"]').fill('450 Updated Billing Rd')
    await page.locator('input[name="billing_city"]').fill('Erie')
    await page.locator('input[name="billing_state"]').fill('PA')
    await page.locator('input[name="billing_zip"]').fill('16501')

    await page.getByRole('button', { name: 'Save changes' }).click()

    await page.waitForURL(`**/companies/${sharedState.id}`)
    await expect(
      page.getByRole('heading', { level: 1, name: newName }),
      'Company detail should show the edited company name after save'
    ).toBeVisible()
    await expect(
      page.getByText(newEmail),
      'Company detail should show the edited billing email after save'
    ).toBeVisible()
    await expect(
      page.getByText('450 Updated Billing Rd'),
      'Company detail should show the edited billing address after save'
    ).toBeVisible()

    sharedState.name = newName
    sharedState.email = newEmail
  })
})

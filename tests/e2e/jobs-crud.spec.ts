import { test, expect } from './fixtures/auth'

// Wave-1 Jobs CRUD lifecycle:
//   list → create → detail → edit → packet PDF
//
// Tests are ORDERED in a describe.serial block because the create step
// produces the job that later steps reuse via shared `state` (cheaper than
// re-creating per test, and matches how staff actually work the surface).
//
// Each run produces a unique job_name suffixed with the test-run timestamp so
// the search filter has something deterministic to find later. RLS scopes by
// tenant — accumulated test data is fine; the brief explicitly waives cleanup.

interface JobState {
  id: string | null
  jobName: string
  jobNumber: string | null
}

const RUN_ID = Date.now().toString(36)
const sharedState: JobState = {
  id: null,
  jobName: `E2E Job ${RUN_ID}`,
  jobNumber: null,
}

test.describe.serial('Jobs CRUD', () => {
  test('can view jobs list', async ({ authenticatedPage: page }) => {
    await page.goto('/jobs')
    await expect(page.getByRole('heading', { level: 1, name: 'Jobs' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'New job' })).toBeVisible()
  })

  test('can create a job', async ({ authenticatedPage: page }) => {
    await page.goto('/jobs/new')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Customer select is required — pick whichever customer the seed exposes
    // first. The empty placeholder option is `disabled`, so the option index 1
    // is the first real value.
    const customerSelect = page.locator('select[name="company_id"]')
    const firstCustomerValue = await customerSelect
      .locator('option')
      .nth(1)
      .getAttribute('value')
    expect(
      firstCustomerValue,
      'Seed must include at least one company for the office tenant'
    ).toBeTruthy()
    await customerSelect.selectOption(firstCustomerValue!)

    await page.locator('input[name="job_name"]').fill(sharedState.jobName)
    await page.locator('select[name="priority"]').selectOption('high')
    await page.locator('input[name="color"]').fill('RAL 9005 matte')

    await page.getByRole('button', { name: 'Create job' }).click()

    // createJobFromForm redirects to /jobs/{id} on success.
    await page.waitForURL(/\/jobs\/[0-9a-f-]{36}$/i)
    const url = new URL(page.url())
    sharedState.id = url.pathname.split('/').pop() ?? null
    expect(sharedState.id).toMatch(/^[0-9a-f-]{36}$/i)

    await expect(page.getByRole('heading', { level: 1, name: sharedState.jobName })).toBeVisible()

    // Job number lives in a `font-mono` paragraph above the H1.
    const jobNumberLocator = page.locator('p.font-mono').first()
    sharedState.jobNumber = (await jobNumberLocator.textContent())?.trim() ?? null
    expect(sharedState.jobNumber, 'Job number should be present on detail page').toBeTruthy()
  })

  test('can view job detail from the list', async ({ authenticatedPage: page }) => {
    test.skip(!sharedState.id, 'Create test must succeed before list-to-detail can run')

    await page.goto(`/jobs?q=${encodeURIComponent(sharedState.jobName)}`)
    const jobLink = page.getByRole('link', { name: sharedState.jobName }).first()
    await expect(jobLink).toBeVisible()
    await jobLink.click()

    await page.waitForURL(`**/jobs/${sharedState.id}`)
    await expect(page.getByRole('heading', { level: 1, name: sharedState.jobName })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Print packet' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Edit' })).toBeVisible()
  })

  test('can edit a job', async ({ authenticatedPage: page }) => {
    test.skip(!sharedState.id, 'Create test must succeed before edit can run')

    await page.goto(`/jobs/${sharedState.id}/edit`)
    const newName = `${sharedState.jobName} (edited)`
    await page.locator('input[name="job_name"]').fill(newName)
    await page.getByRole('button', { name: 'Save changes' }).click()

    await page.waitForURL(`**/jobs/${sharedState.id}`)
    await expect(page.getByRole('heading', { level: 1, name: newName })).toBeVisible()

    sharedState.jobName = newName
  })

  test('can access the packet PDF', async ({ authenticatedPage: page }) => {
    test.skip(!sharedState.id, 'Create test must succeed before packet can run')

    const packetUrl = `/jobs/${sharedState.id}/packet`
    const response = await page.request.get(packetUrl)
    expect(response.status(), 'Packet route should respond 200').toBe(200)

    const contentType = response.headers()['content-type'] ?? ''
    expect(
      contentType.toLowerCase(),
      `Packet should be a PDF stream (got: ${contentType})`
    ).toContain('application/pdf')
  })
})

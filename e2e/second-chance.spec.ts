import { test, expect } from '@playwright/test'

// Playwright test pool — owned by pw-test@ufsl.net
const PW_POOL_ID = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
// Beta pool for general member tests
const BETA_POOL_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

test.describe('2nd chance flows', () => {
  test('dashboard loads and user is authenticated', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'e2e/screenshots/dashboard.png', fullPage: false })
    expect(page.url()).not.toContain('/auth')
    await expect(page.locator('body')).toBeVisible()
    console.log('Dashboard URL:', page.url())
  })

  test('pool/new: pre-fills 2nd chance name + shows member banner', async ({ page }) => {
    await page.goto(`/pools/new?bracket_type=fresh32&from_pool=${PW_POOL_ID}&from_name=Test%20Pool`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'e2e/screenshots/pool-new.png', fullPage: false })

    expect(page.url()).not.toContain('/auth')

    const inputs = page.locator('input[type="text"], input:not([type])')
    const nameVal = await inputs.first().inputValue()
    console.log('Name field value:', nameVal)
    expect(nameVal).toMatch(/2nd Chance/i)

    await expect(page.locator('text=existing pool members')).toBeVisible()
  })

  test('manage dashboard: shows Launch 2nd Chance Pool button', async ({ page }) => {
    await page.goto(`/pools/${PW_POOL_ID}/manage`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'e2e/screenshots/manage.png', fullPage: true })

    expect(page.url()).not.toContain('/auth')
    console.log('Manage URL:', page.url())
    
    // R1 is completed on test DB — 2nd chance button should show
    await expect(page.locator('text=Launch 2nd Chance Pool')).toBeVisible()
  })
})

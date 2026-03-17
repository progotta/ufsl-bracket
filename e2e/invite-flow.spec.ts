import { test, expect } from '@playwright/test'

const PW_POOL_ID = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'

test.describe('Mobile Invite Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/pools/${PW_POOL_ID}/manage`)
    await page.waitForLoadState('networkidle')
    // Ensure we're not on the auth page
    expect(page.url()).not.toContain('/auth')
  })

  test('Share Invite Link button is visible', async ({ page }) => {
    const btn = page.locator('[data-testid="share-invite-link-btn"]')
    await expect(btn).toBeVisible()
    await expect(btn).toContainText('Share Invite Link')
  })

  test('Invite via Text button is visible', async ({ page }) => {
    const btn = page.locator('[data-testid="invite-via-text-btn"]')
    await expect(btn).toBeVisible()
    await expect(btn).toContainText('Invite via Text')
  })

  test('Invite code is displayed prominently', async ({ page }) => {
    const codeEl = page.locator('[data-testid="invite-code"]')
    await expect(codeEl).toBeVisible()
    // The invite code should be a non-empty string
    const codeText = await codeEl.textContent()
    expect(codeText?.trim().length).toBeGreaterThan(0)
  })

  test('Copy code button changes state on click', async ({ page }) => {
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    const copyBtn = page.locator('[data-testid="copy-code-btn"]')
    await expect(copyBtn).toBeVisible()
    await expect(copyBtn).toContainText('Copy')

    await copyBtn.click()

    // After click, button should show "Copied!" feedback
    await expect(copyBtn).toContainText('Copied!', { timeout: 3000 })
  })

  test('Copy link button changes state on click', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    const copyLinkBtn = page.locator('[data-testid="copy-link-btn"]')
    await expect(copyLinkBtn).toBeVisible()
    await expect(copyLinkBtn).toContainText('Copy Link')

    await copyLinkBtn.click()

    await expect(copyLinkBtn).toContainText('Copied!', { timeout: 3000 })
  })

  test('Contact picker button is NOT shown in Chromium (Contacts API unavailable)', async ({ page }) => {
    // The Contacts API is not available in Playwright/Chromium
    // The button should not be rendered at all
    const contactBtn = page.locator('[data-testid="add-from-contacts-btn"]')
    await expect(contactBtn).not.toBeVisible()
  })

  test('Email input and Send button are visible', async ({ page }) => {
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="send-invites-btn"]')).toBeVisible()
  })

  test('Full invite panel screenshot', async ({ page }) => {
    await page.screenshot({ path: 'e2e/screenshots/invite-flow.png', fullPage: false })
  })
})

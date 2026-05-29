import { test, expect } from '@playwright/test'

test.describe('Chat', () => {
  test('chat page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/chat')
    await expect(page).toHaveURL(/.*login/)

    await page.waitForURL(/.*login/, { timeout: 5000 })
  })

  test('chat page displays when authenticated', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/full name/i).fill('E2E Test User')
    await page.getByLabel(/email address/i).last().fill('e2e@example.com')
    await page.getByLabel(/^password$/i).last().fill('password123')
    await page.getByRole('button', { name: /sign up/i }).click()

    await page.waitForURL(/.*chat/, { timeout: 15000 })

    await expect(page.getByRole('heading', { name: /chat with ai/i })).toBeVisible()
    await expect(page.getByLabel(/message input/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /send message/i })).toBeVisible()
  })

  test('message input is interactive', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('e2e@example.com')
    await page.getByLabel(/password/i).first().fill('password123')
    await page.getByRole('button', { name: /login/i }).click()

    await page.waitForURL(/.*chat/, { timeout: 15000 })

    const input = page.getByLabel(/message input/i)
    await input.fill('Hello')
    await expect(input).toHaveValue('Hello')
  })
})

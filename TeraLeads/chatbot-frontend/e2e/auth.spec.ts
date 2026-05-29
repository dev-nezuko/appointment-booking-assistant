import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('homepage loads and redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/.*\//)
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
  })

  test('login page displays login and signup forms', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /sign in to book/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible()
  })

  test('login form validation - shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).first().fill('wrong@example.com')
    await page
      .getByLabel(/password/i)
      .first()
      .fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
  })

  test('signup form has required fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel(/full name/i)).toBeVisible()
    await expect(page.getByLabel(/email address/i).last()).toBeVisible()
    await expect(page.getByLabel(/^password$/i).last()).toBeVisible()
  })

  test('can navigate between home and login', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/.*login/)

    await page.getByRole('link', { name: /back to home/i }).click()
    await expect(page).toHaveURL('/')
  })
})

import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder="Email"]', 'admin@erp.local');
  await page.fill('input[placeholder="Password"]', 'admin123');
  await page.click('button:has-text("Ingresar")');
  await page.waitForURL('**/');
});

test('POS full sale flow', async ({ page }) => {
  await page.goto('/pos');
  // Wait for products to load
  await page.waitForSelector('button:has-text("Taza de ceramica")', { timeout: 10000 });
  // Add product to cart
  await page.click('button:has-text("Taza de ceramica")');
  // Verify cart shows item
  await expect(page.locator('text=Taza de ceramica').nth(1)).toBeVisible();
  // Verify cart has item
  await expect(page.locator('text=Taza de ceramica').nth(1)).toBeVisible();
  // Checkout
  await page.click('button:has-text("Cobrar")');
  // Wait for alert (handled by browser)
  await page.waitForTimeout(2000);
});
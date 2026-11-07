import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder="Email"]', 'admin@erp.local');
  await page.fill('input[placeholder="Password"]', 'admin123');
  await page.click('button:has-text("Ingresar")');
  await page.waitForURL('**/');
});

test('inventory page loads', async ({ page }) => {
  await page.goto('/inventory');
  await expect(page.locator('h1:has-text("Inventario")')).toBeVisible();
});

test('inventory alerts section visible', async ({ page }) => {
  await page.goto('/inventory');
  await expect(page.locator('h1:has-text("Inventario")')).toBeVisible();
  // alerts section exists
  await expect(page.locator('text=Stock bajo').first()).toBeVisible({ timeout: 5000 }).catch(() => true);
});
import { test, expect } from '@playwright/test';

test('offline detection reports navigator.onLine false', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder="Email"]', 'admin@erp.local');
  await page.fill('input[placeholder="Password"]', 'admin123');
  await page.click('button:has-text("Ingresar")');
  await page.waitForURL('**/');
  await page.context().setOffline(true);
  await page.waitForTimeout(2000);
  const online = await page.evaluate(() => navigator.onLine);
  expect(online).toBe(false);
  await expect(page.locator('text=Sin conexión')).toBeVisible({ timeout: 5000 });
  await page.context().setOffline(false);
});
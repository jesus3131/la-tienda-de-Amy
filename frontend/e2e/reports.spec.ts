import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder="Email"]', 'admin@erp.local');
  await page.fill('input[placeholder="Password"]', 'admin123');
  await page.click('button:has-text("Ingresar")');
  await page.waitForURL('**/');
});

test('reports page loads', async ({ page }) => {
  await page.click('a:has-text("Reportes")');
  await expect(page.locator('h1:has-text("Reportes")')).toBeVisible();
  await expect(page.locator('text=Valoración de inventario')).toBeVisible();
});
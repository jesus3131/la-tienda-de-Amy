import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder="Email"]', 'admin@erp.local');
  await page.fill('input[placeholder="Password"]', 'admin123');
  await page.click('button:has-text("Ingresar")');
  await page.waitForURL('**/');
});

test('products page loads and shows table', async ({ page }) => {
  await page.click('a:has-text("Productos")');
  await expect(page.locator('h1:has-text("Productos")')).toBeVisible();
  await expect(page.locator('table')).toBeVisible();
});

test('create product via form', async ({ page }) => {
  await page.click('a:has-text("Productos")');
  await page.click('button:has-text("Nuevo producto")');
  const sku = `E2E-${Date.now()}`;
  await page.fill('input[placeholder="SKU"]', sku);
  await page.fill('input[placeholder="Nombre"]', 'E2E Product');
  await page.fill('input[placeholder="Venta"]', '100');
  await page.click('button:has-text("Crear")');
  await page.waitForTimeout(1000);
  await expect(page.locator(`text=${sku}`)).toBeVisible({ timeout: 5000 });
});
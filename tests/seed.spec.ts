import { test, expect } from '../src/fixtures/base';

test.describe('Seed — environment baseline @smoke', () => {
  test('login page loads', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/#!/login`);
    await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
  });
});
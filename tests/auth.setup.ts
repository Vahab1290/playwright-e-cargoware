import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage';

export const AUTH_FILE = 'playwright/.auth/user.json';

// Logs in once with the .env credentials and saves the session for all tests.
setup('authenticate', async ({ page }) => {
  const username = process.env.QA_USERNAME?.trim() ?? '';
  const password = process.env.QA_PASSWORD?.trim() ?? '';
  setup.skip(!username || !password, 'QA_USERNAME / QA_PASSWORD not set in .env');

  const login = new LoginPage(page);
  await login.goto();
  await login.login(username, password);
  await expect(login.welcomeMenuButton).toBeVisible();
  await page.context().storageState({ path: AUTH_FILE });
});

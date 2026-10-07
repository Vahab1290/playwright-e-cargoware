import { test, expect } from '../src/fixtures/base';
import { LoginPage } from '../src/pages/LoginPage';

test.describe('Fr8manage login', () => {
  test('login page shows the login form @smoke', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await expect(login.usernameInput).toBeVisible();
    await expect(login.passwordInput).toBeVisible();
    await expect(login.loginButton).toBeVisible();
  });

  test('valid login lands on the home page @smoke @critical', async ({ page }) => {
    const username = process.env.QA_USERNAME?.trim() ?? '';
    const password = process.env.QA_PASSWORD?.trim() ?? '';
    test.skip(!username || !password, 'QA_USERNAME / QA_PASSWORD not set in .env');

    const login = new LoginPage(page);
    await login.goto();
    await login.login(username, password);

    await expect(page).toHaveURL(/#!\/home/);
    await expect(login.welcomeMenuButton).toBeVisible();
  });

  test('empty submit shows a required-fields message @regression', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginButton.click();

    await expect(login.requiredFieldsAlert).toBeVisible();
    await expect(page).toHaveURL(/#!\/login/);
  });

  test('invalid credentials show an error @regression', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login('not_a_real_user_12345', 'not_a_real_password');

    await expect(login.invalidCredentialsAlert).toBeVisible();
    await expect(page).toHaveURL(/#!\/login/);
  });
});

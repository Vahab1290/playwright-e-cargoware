import { test, expect } from '../src/fixtures/base';
import { LoginPage } from '../src/pages/LoginPage';
import { HomePage } from '../src/pages/HomePage';
import loginUsers from './data/login-users.json';

test.describe('Fr8manage login', () => {
  test('valid login redirects to the authenticated home page @smoke @critical', async ({
    page,
  }) => {
    const username = process.env.QA_USERNAME?.trim() ?? '';
    const password = process.env.QA_PASSWORD?.trim() ?? '';

    const login = new LoginPage(page);
    const home = new HomePage(page);

    await test.step('navigate to the login page', async () => {
      await login.goto();
      await expect(login.usernameInput).toBeVisible();
      await expect(login.passwordInput).toBeVisible();
      await expect(login.loginButton).toBeVisible();
    });

    await test.step('log in with valid credentials from .env', async () => {
      await login.loginAs(username, password);
    });

    await test.step('verify the authenticated home page', async () => {
      await expect(page).toHaveURL(/#!\/home/);
      await expect(home.welcomeMenuButton).toBeVisible();
      await expect(login.requiredFieldsAlert).toBeHidden();
      await expect(login.invalidCredentialsAlert).toBeHidden();
    });
  });

  test('empty username submission is blocked with a validation message @regression', async ({
    page,
  }) => {
    const login = new LoginPage(page);

    await test.step('navigate to the login page', async () => {
      await login.goto();
    });

    await test.step('submit with username left empty', async () => {
      await login.fillPassword(loginUsers.placeholder.password);
      await login.submit();
    });

    await expect(login.requiredFieldsAlert).toBeVisible();
    await expect(login.usernameInput).toHaveAttribute('aria-invalid', 'true');
    await expect(page).toHaveURL(/#!\/login/);
  });

  test('empty password submission is blocked with a validation message @regression', async ({
    page,
  }) => {
    const login = new LoginPage(page);

    await test.step('navigate to the login page', async () => {
      await login.goto();
    });

    await test.step('submit with password left empty', async () => {
      await login.fillUsername(loginUsers.placeholder.username);
      await login.submit();
    });

    await expect(login.requiredFieldsAlert).toBeVisible();
    await expect(login.passwordInput).toHaveAttribute('aria-invalid', 'true');
    await expect(page).toHaveURL(/#!\/login/);
  });

  test('invalid credentials show an authentication error @regression @critical', async ({
    page,
  }) => {
    const login = new LoginPage(page);
    const home = new HomePage(page);

    await test.step('navigate to the login page', async () => {
      await login.goto();
    });

    await test.step('submit with non-existent credentials', async () => {
      await login.loginAs(loginUsers.invalid.username, loginUsers.invalid.password);
    });

    await expect(login.invalidCredentialsAlert).toBeVisible();
    await expect(page).toHaveURL(/#!\/login/);
    await expect(home.welcomeMenuButton).toBeHidden();
  });

  test(
    '1.4 valid username with wrong password shows an authentication error',
    { tag: ['@p0', '@regression'] },
    async ({ page }) => {
      const username = process.env.QA_USERNAME?.trim() ?? '';
      const login = new LoginPage(page);
      const home = new HomePage(page);

      await test.step('navigate to the login page', async () => {
        await login.goto();
      });

      await test.step('submit the real username with a wrong password', async () => {
        await login.loginAs(username, loginUsers.wrongPassword);
      });

      await expect(login.invalidCredentialsAlert).toBeVisible();
      await expect(page).toHaveURL(/#!\/login/);
      await expect(home.welcomeMenuButton).toBeHidden();
    },
  );

  test(
    '1.6 both username and password empty is blocked with a validation message',
    { tag: ['@p2', '@regression'] },
    async ({ page }) => {
      const login = new LoginPage(page);

      await test.step('navigate to the login page', async () => {
        await login.goto();
      });

      await test.step('submit with both fields left empty', async () => {
        await login.submit();
      });

      await expect(login.requiredFieldsAlert).toBeVisible();
      await expect(login.usernameInput).toHaveAttribute('aria-invalid', 'true');
      await expect(login.passwordInput).toHaveAttribute('aria-invalid', 'true');
      await expect(page).toHaveURL(/#!\/login/);
    },
  );

  test(
    '1.7 password field is masked by default and the show/hide toggle works',
    { tag: ['@p2', '@regression'] },
    async ({ page }) => {
      const login = new LoginPage(page);

      await test.step('navigate to the login page', async () => {
        await login.goto();
      });

      await test.step('fill the password field', async () => {
        await login.fillPassword(loginUsers.placeholder.password);
        await expect(login.passwordInput).toHaveAttribute('type', 'password');
      });

      await test.step('toggle visibility on, then off', async () => {
        await login.togglePasswordVisibility();
        await expect(login.passwordInput).toHaveAttribute('type', 'text');
        await expect(login.passwordInput).toHaveValue(loginUsers.placeholder.password);

        await login.togglePasswordVisibility();
        await expect(login.passwordInput).toHaveAttribute('type', 'password');
      });
    },
  );

  test(
    '1.8 forgot password opens the reset panel and back returns to login',
    { tag: ['@p2', '@regression'] },
    async ({ page }) => {
      const login = new LoginPage(page);

      await test.step('navigate to the login page', async () => {
        await login.goto();
      });

      await test.step('open the forgot-password panel', async () => {
        await login.openForgotPassword();
        await expect(login.resetPasswordInstruction).toBeVisible();
        await expect(login.resetBackButton).toBeVisible();
        await expect(login.resetSubmitButton).toBeVisible();
        await expect(login.loginButton).toBeHidden();
      });

      await test.step('go back to the login form', async () => {
        await login.cancelForgotPassword();
        await expect(login.loginButton).toBeVisible();
        await expect(login.resetPasswordInstruction).toBeHidden();
      });

      await expect(page).toHaveURL(/#!\/login/);
    },
  );

  test(
    '1.9 pressing Enter in the password field submits the form',
    { tag: ['@p1', '@regression'] },
    async ({ page }) => {
      const login = new LoginPage(page);

      await test.step('navigate to the login page', async () => {
        await login.goto();
      });

      await test.step('fill credentials and press Enter instead of clicking Login', async () => {
        await login.fillUsername(loginUsers.invalid.username);
        await login.fillPassword(loginUsers.invalid.password);
        await login.submitWithEnter();
      });

      await expect(login.invalidCredentialsAlert).toBeVisible();
      await expect(page).toHaveURL(/#!\/login/);
    },
  );
});

import { Page, Locator } from '@playwright/test';
import { BasePage } from './basepage';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly cookieOkButton: Locator;
  readonly requiredFieldsAlert: Locator;
  readonly invalidCredentialsAlert: Locator;
  readonly welcomeMenuButton: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByRole('textbox', { name: 'Username' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    // Accessible name is "Login login" (icon ligature appended), so use a regex.
    this.loginButton = page.getByRole('button', { name: /Login/ });
    this.cookieOkButton = page.getByRole('button', { name: 'OK' });
    this.requiredFieldsAlert = page
      .getByRole('alert')
      .filter({ hasText: 'Please fill all required fields.' });
    this.invalidCredentialsAlert = page
      .getByRole('alert')
      .filter({ hasText: 'Invalid UserName/Password' });
    // Accessible name is "Welcome <username> keyboard_arrow_down".
    this.welcomeMenuButton = page.getByRole('button', { name: /^Welcome/ });
  }

  async goto(): Promise<void> {
    // 'load' can hang on third-party SSO assets; DOM ready is enough.
    await this.page.goto('/#!/login', { waitUntil: 'domcontentloaded' });
    await this.waitForReady();
    if (await this.cookieOkButton.isVisible().catch(() => false)) {
      await this.cookieOkButton.click();
    }
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}

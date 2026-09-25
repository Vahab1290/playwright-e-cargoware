import { Page, Locator } from '@playwright/test';
import { BasePage } from './basepage';
import { HomePage } from './HomePage';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly cookieOkButton: Locator;
  readonly requiredFieldsAlert: Locator;
  readonly invalidCredentialsAlert: Locator;
  readonly passwordVisibilityToggle: Locator;
  readonly forgotPasswordButton: Locator;
  readonly resetPasswordInstruction: Locator;
  readonly resetBackButton: Locator;
  readonly resetSubmitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByRole('textbox', { name: 'Username' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    // Accessible name is "Login login" — a Material-icon ligature glyph is
    // concatenated into the button's accessible name by the app, so an exact
    // match on "Login" does not resolve. A regex keeps this role-based.
    this.loginButton = page.getByRole('button', { name: /Login/ });
    this.cookieOkButton = page.getByRole('button', { name: 'OK' });
    this.requiredFieldsAlert = page
      .getByRole('alert')
      .filter({ hasText: 'Please fill all required fields.' });
    this.invalidCredentialsAlert = page
      .getByRole('alert')
      .filter({ hasText: 'Invalid UserName/Password' });
    // The show/hide icon carries no ARIA role (renders as a plain element,
    // not a button), so getByRole cannot target it. getByText's default
    // substring match on 'visibility' resolves in both toggle states
    // ('visibility_off' and 'visibility') without needing a regex, which
    // was observed to hang waiting for an actionable click target.
    this.passwordVisibilityToggle = page.getByText('visibility');
    this.forgotPasswordButton = page.getByRole('button', { name: 'Click here' });
    this.resetPasswordInstruction = page.getByText(
      'Enter your username below to reset your password.',
    );
    this.resetBackButton = page.getByRole('button', { name: 'Back' });
    this.resetSubmitButton = page.getByRole('button', { name: 'Submit' });
  }

  async goto(): Promise<void> {
    // 'load' can hang on this page's third-party SSO button assets; the app
    // is interactive well before 'load' fires, so wait on 'domcontentloaded'
    // instead and let waitForReady/locator auto-waiting handle the rest.
    await this.page.goto('/#!/login', { waitUntil: 'domcontentloaded' });
    await this.waitForReady();
    if (await this.cookieOkButton.isVisible().catch(() => false)) {
      await this.cookieOkButton.click();
    }
  }

  async fillUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.loginButton.click();
  }

  async submitWithEnter(): Promise<void> {
    await this.passwordInput.press('Enter');
  }

  async togglePasswordVisibility(): Promise<void> {
    await this.passwordVisibilityToggle.click();
  }

  async openForgotPassword(): Promise<void> {
    await this.forgotPasswordButton.click();
  }

  async cancelForgotPassword(): Promise<void> {
    await this.resetBackButton.click();
  }

  /** Submits and returns the next page object for a successful login. */
  async loginAs(username: string, password: string): Promise<HomePage> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.submit();
    return new HomePage(this.page);
  }
}

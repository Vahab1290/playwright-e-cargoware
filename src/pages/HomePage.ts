import { Page, Locator } from '@playwright/test';
import { BasePage } from './basepage';

export class HomePage extends BasePage {
  readonly welcomeMenuButton: Locator;

  constructor(page: Page) {
    super(page);
    // Accessible name is "Welcome <username> keyboard_arrow_down" — the
    // trailing text is a Material-icon ligature glyph and the username
    // segment varies per account, so only the leading "Welcome" is asserted.
    this.welcomeMenuButton = page.getByRole('button', { name: /^Welcome/ });
  }

  async goto(): Promise<void> {
    await this.page.goto('/#!/home');
    await this.waitForReady();
  }
}

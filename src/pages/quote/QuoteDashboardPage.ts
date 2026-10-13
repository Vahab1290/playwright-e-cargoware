import { Page, Locator } from '@playwright/test';
import { BasePage } from '../common/basepage';

export class QuoteDashboardPage extends BasePage {
  readonly quoteRefInput: Locator;
  readonly searchButton: Locator;
  readonly dashboardTab: Locator;
  readonly allQuotesTile: Locator;
  readonly lostTile: Locator;

  constructor(page: Page) {
    super(page);
    this.quoteRefInput = page.getByRole('textbox', { name: 'Quote Ref' }).filter({ visible: true });
    this.searchButton = page.getByRole('button', { name: 'Search', exact: true }).filter({ visible: true });
    this.dashboardTab = page.getByRole('button', { name: 'Quote Dashboard', exact: true });
    this.allQuotesTile = page.getByRole('button', { name: /ALL QUOTES/ });
    this.lostTile = page.getByRole('button', { name: /LOST/ });
  }

  async goto(): Promise<void> {
    await this.page.goto('/#!/quoteDashboard', { waitUntil: 'domcontentloaded' });
    await this.waitForReady();
  }

  /** Switches back to the dashboard tab while quote tabs stay open. */
  async show(): Promise<void> {
    await this.dashboardTab.click();
  }

  async searchByRef(ref: string): Promise<void> {
    await this.quoteRefInput.fill(ref);
    await this.searchButton.click();
  }

  /**
   * Grid row for a quote. The grid is ui-grid (divs, not a table) and wraps rows in
   * role="button" elements, which hides them from role queries, so match by class and text.
   */
  rowByRef(ref: string): Locator {
    return this.page.locator('.ui-grid-row').filter({ hasText: ref }).filter({ visible: true });
  }

  async openQuote(ref: string): Promise<void> {
    await this.searchByRef(ref);
    await this.rowByRef(ref).locator('.ui-grid-cell').filter({ hasText: ref }).first().click();
  }
}

import { Page, Locator } from '@playwright/test';
import { BasePage } from './basepage';

export class QuotePage extends BasePage {
  readonly addQuoteButton: Locator;
  readonly carrier: Locator;
  readonly destination: Locator;
  readonly agent: Locator;
  readonly pieces: Locator;
  readonly grossWt: Locator;
  readonly chargeWt: Locator;
  readonly description: Locator;
  readonly saveButton: Locator;
  readonly confirmationDialog: Locator;
  readonly confirmedMessage: Locator;
  readonly confirmationCloseIcon: Locator;

  constructor(page: Page) {
    super(page);
    this.addQuoteButton = page.locator("button[ng-click='showCreateTab()']");
    this.carrier = page.locator("md-select[ng-model='tab.createRequest.companyByAirlineid']");
    this.destination = page.locator("ecw-autocomplete[md-search-text='tab.createRequest.destination'] input");
    this.agent = page.locator("ecw-autocomplete.has-md-open-icon input").first();
    this.pieces = page.locator("input[ng-model='tab.createRequest.pieces']");
    this.grossWt = page.locator("input[ng-model='tab.createRequest.grosswt']");
    this.chargeWt = page.getByRole('textbox', { name: 'Charge Wt', exact: true });
    this.description = page.locator("input[ng-model='tab.createRequest.commodity']");
    this.saveButton = page.locator("button[ng-click='save()']");
    this.confirmationDialog = page.locator('md-dialog.booking-confirmation-modal');
    this.confirmedMessage = this.confirmationDialog.getByText('Your Quotation Has Been confirmed');
    this.confirmationCloseIcon = this.confirmationDialog.locator("md-icon[ng-click='close()']");
  }

  async goto(): Promise<void> {
    await this.page.goto('/#!/quoteDashboard', { waitUntil: 'domcontentloaded' });
    await this.waitForReady();
  }

  async openCreateForm(): Promise<void> {
    await this.addQuoteButton.click();
  }

  async selectCarrier(name: string): Promise<void> {
    await this.carrier.click();
    // Angular Material renders options as <md-option aria-hidden="true"> in a
    // menu attached outside the select, so role/scoped lookups never match.
    await this.page.locator('md-option:visible').filter({ hasText: name }).first().click();
  }

  async selectDestination(code: string): Promise<void> {
    // The airport code is accepted as typed; Tab commits it and fills the routing grid.
    await this.destination.fill(code);
    await this.destination.press('Tab');
  }

  async selectAgent(name: string): Promise<void> {
    await this.agent.fill(name);
    await this.page
      .locator("span[md-highlight-text='tab.createRequest.agent.companyName']")
      .filter({ hasText: name })
      .first()
      .click();
  }

  async fillShipment(pieces: string, grossWt: string, description: string): Promise<void> {
    await this.pieces.fill(pieces);
    await this.grossWt.fill(grossWt);
    await this.description.fill(description);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  /** Reads the quote reference number from the confirmation dialog. */
  async confirmationQuoteRef(): Promise<string> {
    const text = (await this.confirmationDialog.locator('.booking-popup-button-awb').innerText()).trim();
    const match = text.match(/(\d{5,})/);
    if (!match) throw new Error(`Quote ref not found in confirmation dialog: "${text}"`);
    return match[1];
  }

  async closeConfirmation(): Promise<void> {
    await this.confirmationCloseIcon.click();
  }
}

import { Page, Locator } from '@playwright/test';
import { BasePage } from '../common/basepage';
import type { DataRow } from '../../utils/excelReader';

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
  readonly bookingConfirmedMessage: Locator;
  readonly confirmationCloseIcon: Locator;
  readonly updatedMessage: Locator;
  readonly updatedMessageClose: Locator;
  readonly cancelledMessage: Locator;
  readonly cancelQuoteButton: Locator;
  readonly copyQuotationButton: Locator;
  readonly convertBookingButton: Locator;
  readonly closeButton: Locator;
  readonly sellingAmount: Locator;
  readonly sellingRate: Locator;
  readonly ratesSelect: Locator;
  readonly cancelDialog: Locator;
  readonly cancelReason: Locator;
  readonly cancelComments: Locator;
  readonly cancelSaveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.addQuoteButton = page.locator("button[ng-click='showCreateTab()']");
    this.carrier = page.locator("md-select[ng-model='tab.createRequest.companyByAirlineid']").filter({ visible: true });
    this.destination = page.locator("ecw-autocomplete[md-search-text='tab.createRequest.destination'] input").filter({ visible: true });
    this.agent = page.locator("ecw-autocomplete.has-md-open-icon input").filter({ visible: true }).first();
    this.pieces = page.locator("input[ng-model='tab.createRequest.pieces']").filter({ visible: true });
    this.grossWt = page.locator("input[ng-model='tab.createRequest.grosswt']").filter({ visible: true });
    // The label gets a "*" when the carrier makes the field mandatory.
    this.chargeWt = page.getByRole('textbox', { name: /^Charge Wt\s*\*?$/ }).filter({ visible: true });
    this.description = page.locator("input[ng-model='tab.createRequest.commodity']").filter({ visible: true });
    this.saveButton = page.locator("button[ng-click='save()']").filter({ visible: true });
    this.confirmationDialog = page.locator('md-dialog.booking-confirmation-modal');
    this.confirmedMessage = this.confirmationDialog.getByText('Your Quotation Has Been confirmed');
    // Converting to a booking shows the same dialog, but with booking wording and the AWB number.
    this.bookingConfirmedMessage = this.confirmationDialog.getByText('Your Booking Has Been confirmed');
    this.confirmationCloseIcon = this.confirmationDialog.locator("md-icon[ng-click='close()']");
    // An update shows a toast ("Updated Successfully" with a CLOSE button) instead of the dialog.
    this.updatedMessage = page.locator('md-toast').filter({ hasText: 'Updated Successfully' });
    this.updatedMessageClose = this.updatedMessage.getByRole('button', { name: 'Close' });
    // Cancelling shows a toast ("Quotation Cancelled Successfully" with a CLOSE button).
    this.cancelledMessage = page.locator('md-toast').filter({ hasText: 'Quotation Cancelled Successfully' });
    // Several quote tabs can stay mounted at once, so match visible elements only.
    this.cancelQuoteButton = page.getByRole('button', { name: 'Cancel Quote' }).filter({ visible: true });
    this.copyQuotationButton = page.getByRole('button', { name: 'Copy Quotation' }).filter({ visible: true });
    this.convertBookingButton = page.getByRole('button', { name: 'Convert Booking' }).filter({ visible: true });
    this.closeButton = page.getByRole('button', { name: 'Close', exact: true }).filter({ visible: true });
    this.sellingAmount = page.locator("input[ng-model='tab.createRequest.sellingamount']").filter({ visible: true });
    this.sellingRate = page.locator("input[ng-model='tab.createRequest.sellingrate']").filter({ visible: true });
    this.ratesSelect = page.locator("md-select[ng-model='tab.createRequest.rate']").filter({ visible: true });
    this.cancelDialog = page.locator('md-dialog').filter({ hasText: 'Cancel Quotation' });
    this.cancelReason = this.cancelDialog.locator("md-select[ng-model='request.exceptionCode']");
    this.cancelComments = this.cancelDialog.getByRole('textbox');
    this.cancelSaveButton = this.cancelDialog.getByRole('button', { name: 'Save' });
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

  /** Closes the open tab of a quote (the ✕ on "QTE <ref>"), so reopening it loads fresh data. */
  async closeQuoteTab(ref: string): Promise<void> {
    await this.page.getByRole('button', { name: `QTE ${ref} close` }).getByRole('button', { name: 'close' }).click();
  }

  /** Fills the mandatory fields, saves, and returns the new quote ref (closing the confirmation). */
  async createQuote(data: DataRow): Promise<{ ref: string; description: string }> {
    const description = `${data.Description}-${Date.now()}`;
    await this.openCreateForm();
    await this.selectCarrier(data.Carrier);
    await this.selectDestination(data.Dest);
    await this.selectAgent(data.Agent);
    await this.fillShipment(data.Pieces, data.GrossWt, description);
    await this.save();
    await this.confirmedMessage.waitFor({ state: 'visible', timeout: 120_000 });
    const ref = await this.confirmationQuoteRef();
    await this.closeConfirmation();
    return { ref, description };
  }

  async openTab(name: 'Quote' | 'Pricing' | 'Epouch' | 'History'): Promise<void> {
    await this.page.getByRole('tab', { name, exact: true }).filter({ visible: true }).first().click();
  }

  /** Reads a numeric input such as "626.20" or "1,234.50". */
  async numericValue(field: Locator): Promise<number> {
    return Number((await field.inputValue()).replace(/,/g, ''));
  }

  /** A row in the History tab grid (ui-grid, so match by class and text rather than role). */
  historyRow(text: string): Locator {
    return this.page.locator('.ui-grid-row').filter({ hasText: text }).filter({ visible: true });
  }

  /**
   * Convert Booking turns the open quote into an AWB in place. The AWB number is picked from
   * the stock popup and the flight from the flight popup (locators taken from the Selenium suite).
   */
  async convertToBooking(flightNo?: string): Promise<void> {
    await this.convertBookingButton.click();

    // AWB number from stock.
    await this.page.locator("md-icon[ng-click='viewAwbStock(tab,tab.createRequest)']").filter({ visible: true }).click();
    await this.page.locator("button[ng-click='select()']").filter({ visible: true }).click();


    await this.page.waitForTimeout(5000);
    // Flight from the flight details popup: take the first listed flight.
    // The schedule icon often needs a second click before the popup opens, so click until it shows.
const flightIcon = this.page.locator("md-icon[title='Click to open Flight Details Popup']").filter({ visible: true }).first();
const flightDialog = this.page.locator('md-dialog.flight-details');
for (let attempt = 0; attempt < 3 && !(await flightDialog.isVisible()); attempt++) {
  await flightIcon.click();
  await flightDialog.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
}
await flightDialog.waitFor({ state: 'visible' });
    // The grid also renders empty placeholder rows, so only rows with text count.
    // Pick the given flight, or the first listed flight when none is given.
    await flightDialog.locator('.ui-grid-row').filter({ hasText: flightNo ?? /\S/ }).first().locator('.ui-grid-cell').nth(1).click();
    await flightDialog.locator("button[ng-click='select()']").click();
  }

  async cancelQuote(reason: string, comment: string): Promise<void> {
    await this.cancelQuoteButton.click();
    await this.cancelReason.click();
    await this.page.locator('md-option:visible').filter({ hasText: reason }).first().click();
    await this.cancelComments.fill(comment);
    await this.cancelSaveButton.click();
  }
}

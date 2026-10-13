import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../common/basepage';

export class PricingTab extends BasePage {
  readonly addButton: Locator;
  readonly deleteButton: Locator;
  readonly chargeRows: Locator;
  readonly soldAmountTotal: Locator;
  readonly totalAmount: Locator;
  readonly saveButton: Locator;
  readonly savedMessage: Locator;
  readonly savedMessageClose: Locator;

  constructor(page: Page) {
    super(page);
    // The Pricing buttons fire on mousedown (addRow / deleteChargeRow), not ng-click.
    this.addButton = page.locator("button[ng-mousedown^='addRow(tab']").filter({ visible: true });
    this.deleteButton = page.locator("button[ng-mousedown='deleteChargeRow(tab)']").filter({ visible: true });
    // Deleted lines are hidden (ng-hide), so only visible rows count.
    this.chargeRows = page.locator("tr[ng-repeat^='charge in tab.createRequest.chargesheader.chargelines']").filter({ visible: true });
    // "Sold Amount(EUR)" under the grid is a plain table cell; the value is the cell next to the label.
    this.soldAmountTotal = page
      .locator('td', { hasText: /^\s*Sold\s+Amount\(EUR\)\s*$/ })
      .filter({ visible: true })
      .locator('xpath=following-sibling::td[1]');
    this.totalAmount = page.getByLabel('Total Amount EUR (A)').filter({ visible: true });
    // The Pricing tab has its own Save, which validates and saves the charge lines.
    this.saveButton = page.locator("button[ng-click='validateAndSaveChargeLines(tab)']").filter({ visible: true });
    // Saving from the Pricing tab shows a toast ("Saved successfully" with a CLOSE button).
    this.savedMessage = page.locator('md-toast').filter({ hasText: 'Saved successfully' });
    this.savedMessageClose = this.savedMessage.getByRole('button', { name: 'Close' });
  }

  /** The Pricing tab lives inside an open quote; this switches to it. */
  async goto(): Promise<void> {
    await this.page.getByRole('tab', { name: 'Pricing', exact: true }).filter({ visible: true }).first().click();
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  /** The charge line whose code is shown in its Charge Code dropdown, e.g. 'DGR'. */
  chargeRow(code: string): Locator {
    return this.chargeRows.filter({
      has: this.page.locator('md-select-value', { hasText: new RegExp(`^\\s*${code}\\s*$`) }),
    });
  }

  async addCharge(code: string): Promise<void> {
    await this.addButton.click();
    await this.chargeRows.last().locator("md-select[ng-model='charge.chargeCode']").click();
    await this.page
      .locator('.md-select-menu-container.md-active md-option')
      .filter({ hasText: new RegExp(`^\\s*${code}\\s*$`) })
      .first()
      .click();
    // Picking a code makes the app price the line on the server; the description fills in when it's done.
    await expect(this.chargeRow(code).locator("input[ng-model='charge.description']")).not.toHaveValue('', { timeout: 30_000 });
  }

  async deleteCharge(code: string): Promise<void> {
    if (code === 'FRT') throw new Error('FRT (freight) must not be deleted');
    // Clicking a line selects it; Delete removes the selected line.
    await this.chargeRow(code).locator("input[ng-model='charge.description']").click();
    await this.deleteButton.click();
  }

  /** Selling amount (CustAmt) of a charge line. */
  async chargeAmount(code: string): Promise<number> {
    return this.toNumber(await this.chargeRow(code).locator("input[ng-model='charge.soldamount']").inputValue());
  }

  async soldAmount(): Promise<number> {
    return this.toNumber(await this.soldAmountTotal.innerText());
  }

  async totalAmountValue(): Promise<number> {
    return this.toNumber(await this.totalAmount.inputValue());
  }

  private toNumber(value: string): number {
    return Number(value.replace(/,/g, ''));
  }
}

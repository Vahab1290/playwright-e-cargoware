import { test, expect } from '../src/fixtures/base';
import { QuotePage } from '../src/pages/QuotePage';
import { QuoteDashboardPage } from '../src/pages/QuoteDashboardPage';
import { getTestData } from '../src/utils/excelReader';

const CREATE_DATA = ['QuoteData.xlsx', 'Create', 'CreateQuote_Valid'] as const;

test.describe('Fr8manage quote', () => {
  test.beforeEach(async ({ page }) => {
    await new QuoteDashboardPage(page).goto();
  });

  test('create quote with mandatory details @regression', async ({ page }) => {
    const data = await getTestData(...CREATE_DATA);
    const quote = new QuotePage(page);
    const dashboard = new QuoteDashboardPage(page);

    await quote.openCreateForm();
    await quote.selectCarrier(data.Carrier);
    await quote.selectDestination(data.Dest);
    await quote.selectAgent(data.Agent);
    await quote.fillShipment(data.Pieces, data.GrossWt, `${data.Description}-${Date.now()}`);
    // Charge Wt is auto-calculated from the gross weight.
    await expect(quote.chargeWt).toHaveValue(data.ChargeWt);

    
  
    await quote.save();
    // Save is slow on QA; the confirmation dialog carries the new quote ref.
    await expect(quote.confirmedMessage).toBeVisible({ timeout: 120_000 });
    const ref = await quote.confirmationQuoteRef();
    expect(ref).toMatch(/^\d+$/);
    await quote.closeConfirmation();

    // Tariff is applied for the product and route.
    await expect(quote.ratesSelect).toHaveAttribute('aria-label', 'Rates: Tariff');
    expect(await quote.numericValue(quote.sellingAmount)).toBeGreaterThan(0);

    

    // History tab records the creation event.
    await quote.openTab('History');
    await expect(quote.historyRow('Quotation Created')).toBeVisible();

    await dashboard.show();
    await dashboard.searchByRef(ref);
    await expect(dashboard.rowByRef(ref)).toContainText('Quotation Created');
  });

  
  

  test('update an existing quote pieces and weight @regression', async ({ page }) => {
    // Creates a fresh quote so the test starts from a known state, then updates it.
    const update = await getTestData('QuoteData.xlsx', 'Update', 'UpdateQuote');
    const quote = new QuotePage(page);
    const dashboard = new QuoteDashboardPage(page);
    const { ref } = await quote.createQuote(await getTestData(...CREATE_DATA));

    await dashboard.show();
    await dashboard.openQuote(ref);
    await quote.pieces.fill(update.Pieces);
    await quote.grossWt.fill(update.GrossWt);
    await expect(quote.chargeWt).toHaveValue(update.ChargeWt, { timeout: 30_000 });

    await quote.save();
    // Save is slow on QA; wait for the "Updated Successfully" toast right after saving.
    await expect(quote.updatedMessage).toBeVisible({ timeout: 120_000 });

    // Selling amount recalculates as rate x charge weight.
    const rate = await quote.numericValue(quote.sellingRate);
    await expect
      .poll(() => quote.numericValue(quote.sellingAmount))
      .toBeCloseTo(rate * Number(update.ChargeWt), 1);


    

    // The dashboard grid shows the updated pieces and weights.
    await dashboard.show();
    await dashboard.searchByRef(ref);
    const row = dashboard.rowByRef(ref);
    await expect(row).toContainText(update.Pieces);
    await expect(row).toContainText(`${update.GrossWt}.0`);
  });

});

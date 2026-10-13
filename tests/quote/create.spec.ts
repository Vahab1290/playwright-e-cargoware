import { test, expect } from '../../src/fixtures/quote.fixtures';
import { getTestData } from '../../src/utils/excelReader';

test('create quote with mandatory details @regression', async ({ quote, dashboard }) => {
  const data = await getTestData('QuoteData.xlsx', 'Create', 'CreateQuote_Valid');

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
await expect.poll(() => quote.numericValue(quote.sellingAmount), { timeout: 30_000 }).toBeGreaterThan(0);


  // History tab records the creation event.
  await quote.openTab('History');
  await expect(quote.historyRow('Quotation Created')).toBeVisible();

  await dashboard.show();
  await dashboard.searchByRef(ref);
  await expect(dashboard.rowByRef(ref)).toContainText('Quotation Created');
});

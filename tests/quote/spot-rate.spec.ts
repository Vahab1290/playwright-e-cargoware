import { test, expect } from '../../src/fixtures/quote.fixtures';
import { getTestData } from '../../src/utils/excelReader';

test('spot rate quote switches Rates to Spot @regression', async ({ page, quote, dashboard }) => {
  const data = await getTestData('QuoteData.xlsx', 'Create', 'CreateQuote_Valid');
  const spot = await getTestData('QuoteData.xlsx', 'SpotRate', 'SpotRateQuote');

  await quote.openCreateForm();
  await quote.selectCarrier(data.Carrier);
  await quote.selectDestination(spot.Dest);
  await quote.selectAgent(data.Agent);
  await quote.fillShipment(data.Pieces, data.GrossWt, `${data.Description}-${Date.now()}`);

   await quote.grossWt.press('Tab');                      
    // finish entering the weight
await expect(page.getByRole('progressbar')).toBeHidden({ timeout: 30_000 })
  await quote.sellingAmount.fill(spot.SpotRate);
  await quote.sellingAmount.press('Tab');
  await expect(quote.ratesSelect).toHaveAttribute('aria-label', 'Rates: Spot');

  await quote.save();
  // Save is slow on QA; the confirmation dialog carries the new quote ref.
  await expect(quote.confirmedMessage).toBeVisible({ timeout: 120_000 });
  const ref = await quote.confirmationQuoteRef();
  await quote.closeConfirmation();

  // The saved quote keeps the spot rate and shows in the dashboard.
  await expect(quote.ratesSelect).toHaveAttribute('aria-label', 'Rates: Spot');
  await dashboard.show();
  await dashboard.searchByRef(ref);
  await expect(dashboard.rowByRef(ref)).toContainText('Quotation Created');
});

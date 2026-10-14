import { test, expect } from '../../src/fixtures/quote.fixtures';
import { getTestData } from '../../src/utils/excelReader';

test('update a quote pieces and weight @regression', async ({ quote, dashboard }) => {
  // Creates a fresh quote so the test starts from a known state, then updates it.
  const update = await getTestData('QuoteData.xlsx', 'Update', 'UpdateQuote');
  const { ref } = await quote.createQuote(await getTestData('QuoteData.xlsx', 'Create', 'CreateQuote_Valid'));

  await dashboard.show();
  await dashboard.openQuote(ref);
  await quote.pieces.fill(update.Pieces);
  await quote.grossWt.fill(update.GrossWt);
  await expect(quote.chargeWt).toHaveValue(update.ChargeWt, { timeout: 30_000 });

  await quote.save();
  // Save is slow on QA; wait for the "Updated Successfully" toast right after saving.
  await expect(quote.updatedMessage).toBeVisible({ timeout: 120_000 });

  // History tab records the quote events. The open tab keeps the History it first loaded,
  // so close and reopen the quote to load the latest.
  await quote.closeQuoteTab(ref);
  await dashboard.show();
  await dashboard.openQuote(ref);
  await quote.openTab('History');
  // The update is logged as a mail event ("UPDATE QUOTATION MAIL SENT FROM ... TO ...").
  // Soft check: a missing History row is reported, but the dashboard checks still run.
  await expect.soft(quote.historyRow('UPDATE QUOTATION MAIL SENT')).toBeVisible({ timeout: 30_000 });

  // The dashboard grid shows the updated pieces and weight.
  await dashboard.show();
  await dashboard.searchByRef(ref);
  await expect(dashboard.rowByRef(ref)).toContainText(update.Pieces);
  await expect(dashboard.rowByRef(ref)).toContainText(`${update.GrossWt}.0`);
});

test('update a quote: add and delete charges @regression', async ({ quote, dashboard, pricing }) => {
  const data = await getTestData('QuoteData.xlsx', 'Pricing', 'PricingAddDelete');
  // createQuote leaves the new quote open.
  await quote.createQuote(await getTestData('QuoteData.xlsx', 'Create', 'CreateQuote_Valid'));

  await quote.openTab('Pricing');
  const startSold = await pricing.soldAmount();
  const startTotal = await pricing.totalAmountValue();
  const freight = await pricing.chargeAmount('FRT');

  // Add a charge: once saved, Sold Amount and Total Amount go up by its selling amount.
  await pricing.addCharge(data.AddCode);
  const added = await pricing.chargeAmount(data.AddCode);
  await pricing.save();
  await expect(pricing.savedMessage).toBeVisible({ timeout: 120_000 });
  await pricing.savedMessageClose.click();
  await expect.poll(() => pricing.soldAmount(), { timeout: 30_000 }).toBeCloseTo(startSold + added, 2);
  await expect.poll(() => pricing.totalAmountValue()).toBeCloseTo(startTotal + added, 2);


  // Delete a charge: once saved, Sold Amount and Total Amount go down by its selling amount and the line is gone.
  const removed = await pricing.chargeAmount(data.DeleteCode);
  await pricing.deleteCharge(data.DeleteCode);
  await pricing.save();
  await expect(pricing.savedMessage).toBeVisible({ timeout: 120_000 });
  await expect(pricing.chargeRow(data.DeleteCode)).toHaveCount(0);
  await expect.poll(() => pricing.soldAmount(), { timeout: 30_000 }).toBeCloseTo(startSold + added - removed, 2);
  await expect.poll(() => pricing.totalAmountValue()).toBeCloseTo(startTotal + added - removed, 2);

  // Freight is untouched.
  expect(await pricing.chargeAmount('FRT')).toBe(freight);
});

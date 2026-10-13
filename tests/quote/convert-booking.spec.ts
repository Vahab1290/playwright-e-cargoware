import { test, expect } from '../../src/fixtures/quote.fixtures';
import { getTestData } from '../../src/utils/excelReader';

test('convert a quote into a booking changes status to Being processed @regression', async ({ quote, dashboard }) => {
  const { ref } = await quote.createQuote(await getTestData('QuoteData.xlsx', 'Create', 'CreateQuote_Valid'));

  await dashboard.show();
  await dashboard.openQuote(ref);
  await quote.convertToBooking();
  await quote.save();
  // Save is slow on QA; wait for the save confirmation before checking the dashboard.
  await expect(quote.confirmedMessage).toBeVisible({ timeout: 120_000 });
  await quote.closeConfirmation();

  // The quote is now being processed and carries an AWB number.
  await dashboard.show();
  await dashboard.searchByRef(ref);
  await expect(dashboard.rowByRef(ref)).toContainText('Being processed', { timeout: 60_000 });
});

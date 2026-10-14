import { test, expect } from '../../src/fixtures/quote.fixtures';
import { getTestData } from '../../src/utils/excelReader';

test('convert a quote into a booking changes status to Being processed @regression', async ({ quote, dashboard }) => {
  const create = await getTestData('QuoteData.xlsx', 'Create', 'CreateQuote_Valid');
  const convert = await getTestData('QuoteData.xlsx', 'Convert', 'ConvertBooking');
  // Carrier, Agent and Description come from the Create sheet; Dest, Pieces and GrossWt from the Convert sheet.
  const { ref } = await quote.createQuote({ ...create, ...convert });

  await dashboard.show();
  await dashboard.openQuote(ref);
  await quote.convertToBooking(convert.FlightNo);
  await quote.save();
  // Save is slow on QA; wait for the save confirmation before checking the dashboard.
  await expect(quote.bookingConfirmedMessage).toBeVisible({ timeout: 120_000 });
  await quote.closeConfirmation();

  // The quote is now being processed and carries an AWB number.
  await dashboard.show();
  await dashboard.searchByRef(ref);
  await expect(dashboard.rowByRef(ref)).toContainText('Being Processed', { timeout: 60_000 });
});

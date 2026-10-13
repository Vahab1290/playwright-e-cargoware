import { test, expect } from '../../src/fixtures/quote.fixtures';
import { getTestData } from '../../src/utils/excelReader';

test('cancel a quote changes status to Quotation Lost @regression', async ({ quote, dashboard }) => {
  const cancel = await getTestData('QuoteData.xlsx', 'Cancel', 'CancelQuote');
  const { ref } = await quote.createQuote(await getTestData('QuoteData.xlsx', 'Create', 'CreateQuote_Valid'));

 
  await quote.cancelQuote(cancel.Reason, cancel.Comment);
  // Save is slow on QA; wait for the "Quotation Cancelled Successfully" toast right after cancelling.
  await expect(quote.cancelledMessage).toBeVisible({ timeout: 120_000 });

  await dashboard.show();
  await dashboard.searchByRef(ref);
  await expect(dashboard.rowByRef(ref)).toContainText('Quotation Lost', { timeout: 60_000 });
});

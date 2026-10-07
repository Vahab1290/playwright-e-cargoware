import { test, expect } from '../src/fixtures/base';
import { LoginPage } from '../src/pages/LoginPage';
import { QuotePage } from '../src/pages/QuotePage';
import { getTestData } from '../src/utils/excelReader';

test.describe('Fr8manage quote', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(process.env.QA_USERNAME?.trim() ?? '', process.env.QA_PASSWORD?.trim() ?? '');
    await expect(login.welcomeMenuButton).toBeVisible();
  });

  test('create quote with mandatory details @regression', async ({ page }) => {
    const data = await getTestData('QuoteData.xlsx', 'Quote', 'CreateQuote_Valid');
    const quote = new QuotePage(page);

    await quote.goto();
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
    const quoteRef = await quote.confirmationQuoteRef();
    expect(quoteRef).toMatch(/^\d+$/);
    test.info().annotations.push({ type: 'quote-ref', description: quoteRef });

    await quote.closeConfirmation();
    await expect(quote.confirmationDialog).toBeHidden();

    // Record anything that appears next (e.g. the "send quote mail?" prompt).
    await page.waitForTimeout(3000);
    await test.info().attach('after-confirmation', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });
});

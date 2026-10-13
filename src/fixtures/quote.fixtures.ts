import { test as base, expect } from './base';
import { QuotePage } from '../pages/quote/QuotePage';
import { QuoteDashboardPage } from '../pages/quote/QuoteDashboardPage';
import { PricingTab } from '../pages/quote/PricingTab';

type QuoteFixtures = {
  quote: QuotePage;
  dashboard: QuoteDashboardPage;
  pricing: PricingTab;
};

/** Quote module fixtures: `dashboard` opens the Quote Dashboard; `quote` is the quote form page. */
export const test = base.extend<QuoteFixtures>({
  dashboard: async ({ page }, use) => {
    const dashboard = new QuoteDashboardPage(page);
    await dashboard.goto();
    await use(dashboard);
  },
  quote: async ({ page }, use) => {
    await use(new QuotePage(page));
  },
  pricing: async ({ page }, use) => {
    await use(new PricingTab(page));
  },
});

export { expect };

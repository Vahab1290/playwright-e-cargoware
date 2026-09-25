# Project rules for AI agents

You are working in a Playwright TypeScript automation project.
Follow these rules for every code change.

## Stack

- Playwright 1.56+ with TypeScript
- Node 20+
- Test runner: @playwright/test
- Reporter: Allure + built-in HTML
- CI: GitHub Actions, sharded

## Environments

Agents may only open the app on these hosts. Anything else, especially production, is off-limits; stop and ask.

- `localhost` / `127.0.0.1` (any port)
- `qa.fr8manage.app`

## Folder structure

- `src/pages/` — Page Object classes (one file per page)
- `src/fixtures/` — Custom fixtures extending base test
- `src/utils/` — Pure helpers, no test logic
- `tests/` — Spec files, mirror app URL structure
- `tests/seed.spec.ts` — Seed test: base URL, starting state, sign-in
- `tests/data/` — JSON/CSV test data
- `tests/data/files/` — The only files that may be used for upload tests
- `specs/` — Planner output (Markdown plans)

## Authentication and secrets

- Test credentials come from `process.env` only (loaded via the seed test or fixtures). Never hard-code them.
- Saved auth state (`storage-state.json` or similar) is generated at runtime and git-ignored.
- Use only obviously fake data (for example `test.user+qa@example.com`). Never enter real personal data or real card numbers.

## Coding conventions

- Import test from `src/fixtures/base.ts`, never from `@playwright/test` directly
- Import order: fixtures, then page objects, then data
- Use `test.describe` per feature area
- One logical assertion group per test
- Use `test.step` for readability when a flow has more than 3 actions
- File names: kebab-case (`add-to-cart.spec.ts`)

## Test isolation (required for sharded CI)

- Every test must pass on its own and in any order, in any shard.
- No shared state between tests. No test may depend on another test having run.
- A test that changes or deletes data must first create its own disposable data and act only on that.

## Locator priority (STRICT — do not deviate)

1. `getByRole` with accessible name
2. `getByLabel` for form fields
3. `getByPlaceholder` when a field has no label
4. `getByTestId` (attribute is `data-test-id`)
5. `getByText` only for genuinely static UI text
6. CSS / XPath / deep chains / `nth()` when a name is available — forbidden unless justified in a code comment and approved in PR

## Page Object contract

- One class per page, extends `BasePage`
- Constructor takes `page: Page` only
- All locators declared as `readonly` in constructor
- Action methods return `Promise<void>` OR the next page object
- No `expect()` calls inside page objects — assertions belong in tests
- No business logic in tests — put it in page objects or helpers
- Specs never create locators directly; every interaction and assertion goes through a page object

## Assertion rules

- Web-first assertions only (`expect(locator).toBeVisible()`, `toHaveText()`, `toHaveCount()`, etc.)
- No `page.waitForTimeout` — ever
- No `waitForSelector` — use locator auto-waiting
- No `waitForLoadState('networkidle')`
- Custom timeouts only when justified in a code comment (the Healer agent may never raise timeouts; it must ask)
- Regular expressions in assertions only for genuinely dynamic values (timestamps, IDs), never to loosen static text

## Tags

Tags go in Playwright's `tag` option, not in the test title:

```ts
test('1.2 Login fails with wrong password', { tag: ['@regression', '@negative', '@p1'] }, async ({ page }) => { ... });
```

| Tag | Meaning |
|---|---|
| `@p0` / `@p1` / `@p2` | Priority. Every test has exactly one. `@p0` = core flow, feature unusable if broken |
| `@smoke` | Fast, critical checks run on every PR |
| `@regression` | Full regression suite |
| `@negative` | Invalid input, errors, unauthorized access |
| `@edge` | Boundaries and unusual states |
| `@flaky-risk` | Timing-sensitive behaviour was observed; explained in the PR |

**Legacy:** existing tests may still have `@critical` in the title. Treat it as `@p0`. Do not add `@critical` to new tests. During migration, CI filters should match both (`--grep "@p0|@critical"`).

## When adding a new test

- Mirror the app URL structure inside `tests/`
- Reuse existing page objects — do not create parallel infra
- Load test data from `tests/data/`, not inline
- Apply tags as described above

## AI agent workflow (Planner → Generator → Healer)

- **Plans** live in `specs/<feature-name>.md`. Scenarios are numbered `<feature-group>.<scenario>` (`1.1`, `1.2`, `2.1`, ...) and each has a priority and tags.
- **Specs** contain one scenario per file. The test title starts with the scenario number (`'1.2 Login fails with wrong password'`), and the file begins with:
  ```ts
  // spec: specs/<plan-file>.md
  // seed: tests/seed.spec.ts
  ```
- The plan is the source of truth for what a test must prove. Agents never edit plans to match the app; they report mismatches.
- The Generator hands a test to the Healer after 3 failed fix attempts. The Healer escalates to a human after 2.
- Healer reports use the format defined in the Healer agent file and must be included in the PR description.

## Forbidden

- Do not skip, `fixme`, or comment out failing tests to make CI green
- Do not weaken or remove assertions to make a test pass
- Do not use `page.evaluate` unless there is no MCP tool alternative
- Do not commit `.env`, credentials, `storage-state.json`, or auth tokens
- Do not modify `playwright.config.ts` or `src/fixtures/base.ts` without asking
- Do not add new npm dependencies without asking
- Do not use `page.pause()` in committed code
- Do not click destructive controls (delete, cancel, pay, send) against data the test did not create

## When you (the agent) are unsure

- Ask a clarifying question before generating code
- Prefer a smaller, focused change over a big refactor
- Plans, specs, and new entries in existing data files are expected outputs and don't need permission. Ask before creating new infrastructure: page objects, fixtures, utils, config, or new data files.
- If running unattended with no one to ask, make no risky changes: leave the test failing and write a clear report.
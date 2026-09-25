# Test Plan: Fr8manage Login

**Target:** https://qa.fr8manage.app (BASE_URL from .env), path /#!/login
**Seed:** tests/seed.spec.ts
**Date:** 2026-09-24

## Overview

This plan covers the login flow for the Fr8manage QA environment: a successful
login with valid credentials, the main negative paths (empty username, empty
password, both empty, wrong password, unregistered username), and the
supporting UI behaviors on the login page (password masking/toggle, the
"Forgot your password?" panel, and Enter-key submission). It confirms both
the client-side "required fields" validation and the server-side "invalid
credentials" response, and verifies the app lands on the authenticated home
view after a successful login. Re-explored live against
`https://qa.fr8manage.app/#!/login` on 2026-09-24.

## Preconditions

- `BASE_URL`, `QA_USERNAME`, and `QA_PASSWORD` are defined in `.env` and loaded
  by the test runner/config.
- The QA environment (`https://qa.fr8manage.app`) is reachable and the login
  page renders without requiring any prior authenticated session.
- Tests start from a logged-out state (no `storage-state.json` / session reuse
  for these scenarios).
- Valid credentials from `.env` (`QA_USERNAME` / `QA_PASSWORD`) correspond to
  an active, non-locked account.
- A cookie-consent banner ("We use cookies to give you a better experience...")
  with an "OK" button is present on first load and must be dismissed (or
  otherwise not block) before interacting with the login form.

## Scenarios

### Scenario 1.1 — Valid login redirects to the authenticated home page
- **Priority:** P0
- **Tags:** @smoke @critical
- **Preconditions:** User is logged out; browser is on `/#!/login`.
- **Steps:**
  1. Navigate to `${BASE_URL}/#!/login` — expected: Username and Password
     textboxes and a "Login" button are visible.
  2. Fill the Username field with valid credentials from `.env`
     (`QA_USERNAME`) — expected: value is reflected in the field.
  3. Fill the Password field with valid credentials from `.env`
     (`QA_PASSWORD`) — expected: value is masked/entered in the field.
  4. Click the "Login" button — expected: app navigates away from the login
     route.
- **Assertions:**
  - URL changes to `${BASE_URL}/#!/home` (no longer on `/#!/login`).
  - The header/menu area shows a "Welcome <username>" control, confirming an
    authenticated session for the logged-in user.
  - No "Please fill all required fields." or "Invalid UserName/Password"
    alert is shown.
- **Edge cases considered:**
  - Trailing/leading whitespace in credentials from `.env`.
  - Session/cookie already present from a previous test bleeding into this
    one (mitigate by running in a fresh/incognito context or clearing storage
    state before this test).
  - Not re-verified live during this exploration session (no test-safe
    credentials available to the Planner) — relies on the existing
    implementation in `tests/login.spec.ts`, which passed on chromium in the
    most recent run.

### Scenario 1.2 — Empty username submission is blocked with a validation message
- **Priority:** P1
- **Tags:** @regression
- **Preconditions:** User is logged out; browser is on `/#!/login`; both
  fields empty.
- **Steps:**
  1. Navigate to `${BASE_URL}/#!/login` — expected: login form visible.
  2. Leave Username empty; fill Password with any placeholder value —
     expected: Password field shows entered value.
  3. Click the "Login" button — expected: form does not submit / navigate.
- **Assertions:**
  - An alert with the text "Please fill all required fields." becomes
    visible, with a "Close" button to dismiss it.
  - The Username textbox is marked invalid (e.g. `aria-invalid`/invalid
    state).
  - URL remains on `/#!/login` (no navigation to `/#!/home`).
- **Edge cases considered:**
  - Username containing only whitespace (should be treated as empty by a
    well-behaved app, but is worth calling out as unverified behavior).

### Scenario 1.3 — Empty password submission is blocked with a validation message
- **Priority:** P1
- **Tags:** @regression
- **Preconditions:** User is logged out; browser is on `/#!/login`; both
  fields empty.
- **Steps:**
  1. Navigate to `${BASE_URL}/#!/login` — expected: login form visible.
  2. Fill Username with any placeholder value; leave Password empty —
     expected: Username field shows entered value.
  3. Click the "Login" button — expected: form does not submit / navigate.
- **Assertions:**
  - An alert with the text "Please fill all required fields." becomes
    visible, with a "Close" button to dismiss it.
  - The Password textbox is marked invalid (e.g. `aria-invalid`/invalid
    state).
  - URL remains on `/#!/login` (no navigation to `/#!/home`).
- **Edge cases considered:**
  - Password field visibility toggle should not affect validation outcome —
    covered separately as Scenario 1.7.

### Scenario 1.4 — Valid username with wrong password shows an authentication error
- **Priority:** P0
- **Tags:** @regression @critical
- **Preconditions:** User is logged out; browser is on `/#!/login`.
- **Steps:**
  1. Navigate to `${BASE_URL}/#!/login` — expected: login form visible.
  2. Fill Username with valid credentials from `.env` (`QA_USERNAME`) —
     expected: value entered.
  3. Fill Password with an incorrect value (not `QA_PASSWORD`) — expected:
     value entered.
  4. Click the "Login" button — expected: request is sent to the server and
     rejected.
- **Assertions:**
  - An alert with the text "Invalid UserName/Password" becomes visible, with
    a "Close" button to dismiss it.
  - URL remains on `/#!/login` (no navigation to `/#!/home`).
  - No authenticated "Welcome <username>" control appears in the header.
- **Edge cases considered:**
  - Repeated invalid attempts potentially triggering account lockout/rate
    limiting is not verified here (see "Not covered").
  - Requires a valid, real username (`QA_USERNAME`) — not verified live
    during this session (would require using the real QA account's username
    with a deliberately wrong password); relies on the generic error message
    being identical to Scenario 1.5, which was confirmed live.

### Scenario 1.5 — Unregistered username shows an authentication error
- **Priority:** P1
- **Tags:** @regression
- **Preconditions:** User is logged out; browser is on `/#!/login`.
- **Steps:**
  1. Navigate to `${BASE_URL}/#!/login` — expected: login form visible.
  2. Fill Username with a value that does not correspond to a real account
     (e.g. `definitely_not_a_real_user_12345`) — expected: value entered.
  3. Fill Password with any value — expected: value entered.
  4. Click the "Login" button — expected: request is sent to the server and
     rejected.
- **Assertions:**
  - An alert with the text "Invalid UserName/Password" becomes visible, with
    a "Close" button to dismiss it (the app does not distinguish
    "unknown user" from "wrong password" in its messaging).
  - URL remains on `/#!/login` (no navigation to `/#!/home`).
  - No authenticated "Welcome <username>" control appears in the header.
- **Edge cases considered:**
  - Confirmed live during this session: filling
    `definitely_not_a_real_user_12345` / `definitely_wrong_password` and
    submitting produced the "Invalid UserName/Password" alert with no
    navigation.

### Scenario 1.6 — Both username and password empty is blocked with a validation message
- **Priority:** P2
- **Tags:** @regression
- **Preconditions:** User is logged out; browser is on `/#!/login`; both
  fields empty.
- **Steps:**
  1. Navigate to `${BASE_URL}/#!/login` — expected: login form visible.
  2. Leave both Username and Password empty — expected: no values entered.
  3. Click the "Login" button — expected: form does not submit / navigate.
- **Assertions:**
  - An alert with the text "Please fill all required fields." becomes
    visible, with a "Close" button to dismiss it.
  - Both the Username and Password textboxes are marked invalid.
  - URL remains on `/#!/login` (no navigation to `/#!/home`).
- **Edge cases considered:**
  - Confirmed live during this session: clicking "Login" with both fields
    untouched produced the same required-fields alert and both fields marked
    invalid.

### Scenario 1.7 — Password field is masked by default and the show/hide toggle works
- **Priority:** P2
- **Tags:** @regression
- **Preconditions:** User is logged out; browser is on `/#!/login`.
- **Steps:**
  1. Navigate to `${BASE_URL}/#!/login` — expected: login form visible.
  2. Fill the Password field with a test value (e.g. `TestPassword123`) —
     expected: value entered but masked (input type is password).
  3. Click the visibility-toggle icon inside the Password field — expected:
     the value becomes visible as plain text.
  4. Click the icon again — expected: the value is masked again.
- **Assertions:**
  - Before the first toggle, the Password input's `type` attribute is
    `password` (value not visible as plain text in the DOM/snapshot).
  - After the first toggle, the Password input's `type` attribute is `text`
    and the entered value is visible.
  - After the second toggle, the input reverts to `type="password"`.
- **Edge cases considered:**
  - Confirmed live during this session: toggling switched the icon glyph
    between `visibility_off` and `visibility`, and the accessibility
    snapshot revealed the plain-text value only after toggling.
  - **Locator exception required:** the toggle icon has no ARIA role (it is
    a plain `generic` element, not a `button`), so `getByRole` cannot target
    it. The Generator should use a `getByText` (or a scoped selector within
    the password field's container) with a code comment justifying the
    departure from strict role-based locators, per `AGENTS.md`'s locator
    priority exception process.

### Scenario 1.8 — "Forgot your password?" opens the reset-password panel and "Back" returns to login
- **Priority:** P2
- **Tags:** @regression
- **Preconditions:** User is logged out; browser is on `/#!/login`.
- **Steps:**
  1. Navigate to `${BASE_URL}/#!/login` — expected: login form visible,
     including a "Forgot your password?" prompt with a "Click here" button.
  2. Click "Click here" — expected: the panel switches in place (no URL
     change) to a reset-password form.
  3. Click "Back" — expected: the panel switches back to the login form.
- **Assertions:**
  - After step 2: a "Forgot your password?" heading, an "Enter your username
    below to reset your password." instruction, a Username textbox, and
    "Back"/"Submit" buttons are visible; the original Login/Password fields
    are no longer visible.
  - The URL remains `/#!/login` throughout (this is an in-page panel swap,
    not a route change).
  - After step 3: the original Username/Password/Login form is visible again.
- **Edge cases considered:**
  - Actually submitting the reset-password form is out of scope here (see
    "Not covered") — this scenario only verifies navigation to and from the
    panel.

### Scenario 1.9 — Pressing Enter in the password field submits the form
- **Priority:** P1
- **Tags:** @regression
- **Preconditions:** User is logged out; browser is on `/#!/login`.
- **Steps:**
  1. Navigate to `${BASE_URL}/#!/login` — expected: login form visible.
  2. Fill Username with a non-existent value (e.g.
     `definitely_not_a_real_user_12345`) — expected: value entered.
  3. Fill Password with any value — expected: value entered.
  4. Press "Enter" while focus is in the Password field — expected: the form
     submits without clicking the "Login" button.
- **Assertions:**
  - An alert with the text "Invalid UserName/Password" becomes visible
    (same server response as clicking "Login" with the same credentials).
  - URL remains on `/#!/login`.
- **Edge cases considered:**
  - Confirmed live during this session: pressing Enter after filling both
    fields with invalid credentials produced the identical
    "Invalid UserName/Password" alert as the mouse-click flow.

## Not covered (and why)

- **Session/logout redirect (originally requested as 1.10: after logout,
  navigating to a protected URL redirects to `/#!/login`)** — not
  implementable by the Planner in this session: there are no valid QA
  credentials available to actually log in, exercise logout, and observe the
  redirect. Requires either real credentials being supplied for live
  verification, or handing this scenario to the Generator to implement
  against `.env` credentials at spec-writing time and confirm during a live
  run.
- **Account lockout after repeated failed attempts** — not explored to avoid
  locking the shared QA credentials or triggering rate-limiting side effects
  during planning/exploration.
- **Reset-password form submission** — Scenario 1.8 verifies only opening and
  leaving the panel; actually submitting a reset request is out of scope
  (would trigger a real email/side effect against a real or fake account).
- **"Continue With Google" / "Continue With Microsoft" SSO buttons** — out of
  scope; these are third-party OAuth flows requiring separate test
  infrastructure and are not part of the username/password login scope
  requested.
- **Whitespace-only / SQL-injection-style / excessively long input in
  Username or Password** — flagged as an edge case but not written as a full
  scenario since expected behavior (client vs. server-side handling) was not
  confirmed during exploration.
- **Cookie-consent banner interaction** — a cookie notice with an "OK" button
  is present on first load; scenarios assume it does not block interaction
  with the login form, but if it does, a preliminary dismissal step should be
  added by the Generator.

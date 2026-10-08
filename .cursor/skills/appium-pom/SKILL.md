---
name: appium-pom
description: >-
  Page Object Model + OOP rules for Appium/WebdriverIO Android tests (BasePage,
  pages, components, thin scripts). Use when creating or editing page objects,
  flow components, tests, locators placement, or when the user mentions POM,
  OOP, SOLID, page class, or /appium-pom.
---

# Appium POM + OOP

## Rules (non-negotiable)

1. **Locators live only in page classes** — never in tests/scripts/components as raw XPath strings for UI.
2. **Reuse** existing methods. No duplicate helpers or copy-paste flows.
3. **Inheritance**: pages extend `BasePage` (`show`, `findFirst`, `tap`, `tapAt`, `scroll`, `type`, `isVisible`).
4. **Separation**:
   - `pages/*` — UI only
   - `services/*` — multi-page orchestration + driver/config
   - `scripts/*` — env + session + call service
   - `tests/*` — Mocha assertions / WDIO specs
5. **Minimum code** — change only what the task needs.
6. Prefer `waitUntil` / `isVisible` over fixed `sleep` (except `show()` / `STEP_PAUSE_MS` for visibility).

## File map

```
pages/BasePage.js
pages/LoginPage.js
pages/HomePage.js          # goHome, openFund, openFundThenWithdraw
pages/MarketplacePage.js
pages/ProjectBuyPage.js
pages/PaymentGatewayPage.js
pages/ReceiptPage.js
pages/WithdrawPage.js
services/BuyFlowComponent.js
services/WithdrawFlowComponent.js
services/DriverManager.js
services/SessionFactory.js
services/AppConfig.js
```

## New page checklist

- [ ] Class extends `BasePage`
- [ ] Selectors as arrays of candidates on `this.*`
- [ ] Public methods named as user actions (`openFund`, `enterAmount`)
- [ ] Call `show('label')` after meaningful taps
- [ ] Forced coords only as **fallback** inside the page method
- [ ] Wire from component/test — do not put orchestration in the page

## New flow checklist

- [ ] Prefer extend `BuyFlowComponent` / `WithdrawFlowComponent`
- [ ] After WEBVIEW / payment, call session recover if UIA2 dies
- [ ] Thin script sets env then `require` flow

## Anti-patterns

- Locators in `scripts/*.js`
- New `sleep(5000)` without reason
- Full-file rewrite when a method edit suffices
- Committing `.env` or credentials in code

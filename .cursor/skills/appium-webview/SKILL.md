---
name: appium-webview
description: >-
  Appium hybrid WEBVIEW / Chrome Custom Tab payment automation (ShurjoPay
  mBANKING, bKash OTP/PIN). Use when switching contexts, filling gateway
  fields, WEBVIEW closes after pay, or user mentions ShurjoPay, mBANKING,
  bKash WEBVIEW, /appium-webview.
---

# Appium WEBVIEW / hybrid payments

## Context

```js
await driver.switchContext('NATIVE_APP');
const contexts = await driver.getContexts(); // NATIVE_APP + WEBVIEW_*
await driver.switchContext(contexts.find((c) => String(c).includes('WEBVIEW')));
```

After pay, Chrome Custom Tab often **closes** → UIA2 may crash. Recover session; do not fail solely on WEBVIEW gone.

## ShurjoPay mBANKING

1. Wait WEBVIEW
2. Tap `#mbanking_style` (or labeled mBANKING)
3. Mobile `#input-38` / PIN `#input-41` (IDs may drift — prefer visible labels + JS fill)
4. Pay Now
5. Back to native success

Credentials: `MBANKING_NUMBER`, `MBANKING_PIN` (sandbox often `01772559986` / `1234`).

## bKash WEBVIEW (forced)

Order: `#WALLET` → confirm → `#OTP` → confirm → `#PIN` → confirm.

```js
// Prefer PaymentGatewayPage.completeBkashPayment / forceConfirmBkash
```

If PIN step throws because WEBVIEW closed → treat as **OK**, wait native success.

## Rules

- Keep gateway logic in `PaymentGatewayPage.js`
- Orchestration in `BuyFlowComponent._checkout`
- After gateway: pause, `switchContext('NATIVE_APP')`, then success/receipt or recover
- `SKIP_RECEIPT=1` when chaining withdraw (keeps session healthier)

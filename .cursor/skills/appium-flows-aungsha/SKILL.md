---
name: appium-flows-aungsha
description: >-
  Aungsha verified mobile E2E flows — login, SurjoPay buy, bKash buy, wallet
  credit, Fund withdraw. Use when implementing or running buy/withdraw/login
  flows, or /appium-flows-aungsha /compet flow questions.
---

# Aungsha verified flows

## Login (TC-AUTH-01)

`LoginPage.ensureLoggedIn` / `login` → `HomePage.waitUntilLoaded`

## Buy SurjoPay / mBANKING (TC-BUY-01)

Home → Buy Shares → Cloud 9 (skip height>900) → Continue → Others → SurjoPay WEBVIEW → mBANKING → success → optional receipt/cert (`apps/downloads/`)

## Buy bKash

Same to payment chooser → bKash → WEBVIEW `#WALLET` → `#OTP` → `#PIN` (WEBVIEW close after PIN = OK) → native success

## Wallet + SurjoPay

`WALLET_AMOUNT` on Purchase Details → rest SurjoPay. `RESUME_PURCHASE=1` if already on Purchase Details.

## Withdraw (PASS)

```
Home → Fund (Available to Withdraw) → ImageView Withdraw CTA
  → bKash number → Continue to Amount → 500 → Submit Withdrawal
```

CLI: `$env:SKIP_BUY="1"; node .\scripts\withdrawal-flow.js`

## After any WEBVIEW

Plan `/appium-session-recover` before next native steps (especially withdraw after buy).

## Components

- `BuyFlowComponent.execute(method)`
- `WithdrawFlowComponent.execute({ skipBuy })`

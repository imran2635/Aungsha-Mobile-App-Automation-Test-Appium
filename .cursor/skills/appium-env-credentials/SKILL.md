---
name: appium-env-credentials
description: >-
  Appium test env vars and sandbox credential keys (no secret values in git).
  Use when setting .env, BUY_METHOD, SKIP_BUY, wallet/withdraw/bkash keys, or
  /appium-env-credentials.
---

# Env + credentials (mobile tests)

## Never commit

`.env`, APKs, real OTPs, production passwords. Use `.env.example` for names only.

## Core keys

`EMAIL`, `PASSWORD`, `DEVICE_UDID`, `APP_PACKAGE`, `APP_ACTIVITY`, `APPIUM_HOST`, `APPIUM_PORT`, `STEP_PAUSE_MS`

## Flow keys

| Flow | Keys |
|------|------|
| SurjoPay / mBANKING | `MBANKING_NUMBER`, `MBANKING_PIN`, `BUY_METHOD=surjoypay` |
| bKash buy | `BKASH_NUMBER`, `BKASH_OTP`, `BKASH_PIN`, `BUY_METHOD=bkash` |
| Wallet on purchase | `WALLET_AMOUNT`, optional `RESUME_PURCHASE=1` |
| Withdraw | `WITHDRAW_BKASH_NUMBER`, `WITHDRAW_AMOUNT`, `SKIP_BUY=1` |
| Faster chain | `SKIP_RECEIPT=1` |
| Install APK | `APP_PATH` + `FORCE_APP_INSTALL=1` |

## Read from code

`AppConfig.getCredentials()`, `getMBankingCredentials()`, `getBkashCredentials()`, `getWithdrawalCredentials()`.

## Sandbox (staging only — document in skills, not commit secrets)

mBANKING / withdraw number often `01772559986`, pin `1234`; withdraw demo amount `500`. Prefer env override in real runs.

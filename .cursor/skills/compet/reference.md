# /compet reference — full codebase + chat decisions

## Repo root

`E:\Aungsha-Mobile-App-Automation-Test` (GitHub: `imran2635-Aungsha-Mobile-App-Automation-Test-Appium`)

## Source tree (automation)

```
src/
  config/AppConfig.js          # EMAIL/PASSWORD, MBANKING_*, BKASH_*, WITHDRAW_*, caps
  core/DriverManager.js        # setDriver, launchApp, terminateApp, takeScreenshot
  core/SessionFactory.js       # createStandalone()
  components/
    BuyFlowComponent.js        # login → Cloud9 → checkout → docs; session recover
    WithdrawFlowComponent.js   # optional buy → Fund → Withdraw; recover + retry
  pages/
    BasePage.js                # show, findFirst, tap, tapAt, scroll, type, isVisible
    LoginPage.js               # login, ensureLoggedIn
    HomePage.js                # goHome, openFund, openFundThenWithdraw, waitUntilLoaded
    MarketplacePage.js         # openBuyShares, openCloud9Inani
    ProjectBuyPage.js          # tapBuy, confirmPurchase, wallet, Others/SurjoPay/bKash
    PaymentGatewayPage.js      # mBANKING + forced bKash WEBVIEW
    ReceiptPage.js             # waitForSuccess, captureReceiptAndCertificate
    WithdrawPage.js            # bKash method, amount, Submit Withdrawal
  tests/
    login-flow.test.js
    buy-flow.test.js
    buy-bkash.test.js
scripts/
  withdrawal-flow.js           # Fund → Withdraw CLI
  project-buy-bkash.js
  fund-balance-project-buy-surjoypay.js
  fund-balance-project-buy-bkash.js
  download-receipt-cert.js
  run-pom-buy.js / run-with-banner.js
  tools/                       # _ui-labels.js, inspect-device.js
  legacy/                      # explore/dump/fill helpers
artifacts/                     # screenshots + logs (gitignored)
apps/downloads/                # receipt.png, dumps (gitignored)
.cursor/skills/                # compet + appium-* skills
FLOW_DOCUMENTATION.md
wdio.conf.js
.env                           # secrets — never commit
```

## package.json scripts

| Script | Meaning |
|--------|---------|
| `appium` | Appium `127.0.0.1:4723` |
| `test:login` | WDIO login |
| `test:buy` | WDIO buy POM |
| `test:buy:bkash` | WDIO bKash |
| `test:buy:script` | legacy buy script |
| `test:buy:bkash:script` | bKash buy CLI |
| `test:buy:surjoypay:script` | wallet + SurjoPay |
| `test:buy:bkash-fund:script` | wallet + bKash |
| `test:withdraw:script` | withdraw flow |
| `test:receipt` | receipt/cert |
| `inspect:device` | package helper |

## Env keys (names only)

`APP_PACKAGE`, `APP_ACTIVITY`, `EMAIL`, `PASSWORD`, `APPIUM_HOST`, `APPIUM_PORT`, `DEVICE_UDID`, `APP_PATH`, `MBANKING_NUMBER`, `MBANKING_PIN`, `BKASH_NUMBER`, `BKASH_OTP`, `BKASH_PIN`, `WALLET_AMOUNT`, `RESUME_PURCHASE`, `BUY_METHOD`, `SKIP_BUY`, `SKIP_RECEIPT`, `WITHDRAW_BKASH_NUMBER`, `WITHDRAW_AMOUNT`, `STEP_PAUSE_MS`, `FORCE_APP_INSTALL`, `START_APPIUM`, `HIDE_ANIMATION`

Sandbox: mBANKING/withdraw `01772559986` pin `1234`; withdraw amount `500`.

## Withdraw path (verified PASS)

1. `SKIP_BUY=1` (or full buy then recover)
2. Home tab → Fund / wallet (`Available to Withdraw`)
3. Tap clickable **ImageView** `Withdraw` CTA (not title / not only bottom nav)
4. bKash `01772559986` → Continue to Amount → `500` → Submit Withdrawal
5. Forced coords fallbacks exist in `HomePage` / `WithdrawPage`

## Buy path (verified)

1. terminate + launch → soft login
2. Buy Shares → Cloud 9 (Inani) — skip height > 900
3. Continue → Others → SurjoPay WEBVIEW mBANKING **or** bKash WEBVIEW
4. Native success → optional receipt/cert under `apps/downloads/`
5. UIA2 often dies after WEBVIEW — recover before next UI steps

## Chat decisions timeline

1. Emulator “koro” → AVD `Aungsha_Emu` only.
2. POM refactor: locators in pages, SOLID, no dupes.
3. Added PaymentGateway / Receipt pages + login/buy tests.
4. bKash forced WEBVIEW fill; PIN WEBVIEW close = OK.
5. Wallet credit on Purchase Details (SurjoPay PASS; bKash flaky).
6. Withdraw: Home → Fund → CTA → bKash → 500 → Submit PASS (`EXIT=0`).
7. Swagger helps API asserts, **not** UI locators — use dumps/Inspector.
8. Skills pack under `.cursor/skills/`: compet, appium-mobile, pom, locators, emulator-adb, wdio-mocha, webview, session-recover, debug, env-credentials, flows-aungsha, skills-index.

## Coding preferences for future agents

- Extend `BasePage`; orchestration in components; thin scripts.
- After payment always plan for session recover.
- Update this reference when npm scripts or major flows change.
- Git: never force-push unless asked; never commit `.env`; no Cursor co-author.

## Local device notes

- `adb devices`: `emulator-5554` and optionally physical tablet.
- Default `DEVICE_UDID=emulator-5554`.
- Emulator: `%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe -avd Aungsha_Emu`

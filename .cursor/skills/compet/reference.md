# /compet reference — full codebase + chat decisions

## Repo root

`E:\Aungsha-Mobile-App-Automation-Test` (also pushed to GitHub as `imran2635-Aungsha-Mobile-App-Automation-Test-Appium`)

## Source tree (automation)

```
src/
  config/AppConfig.js          # EMAIL/PASSWORD, MBANKING_*, caps, getMBankingCredentials()
  core/DriverManager.js        # setDriver, launchApp, terminateApp, takeScreenshot
  pages/
    BasePage.js                # show, findFirst, tap, tapAt, scroll, type, isVisible
    LoginPage.js               # login (force logout demo), ensureLoggedIn (soft)
    HomePage.js                # waitUntilLoaded, isLoggedIn
    MarketplacePage.js         # openBuyShares, openCloud9Inani (skip h>900 cards)
    ProjectBuyPage.js          # tapBuy, confirmPurchase, selectOthersPayment, card sandbox
    PaymentGatewayPage.js      # completeMBankingPayment (WEBVIEW)
    ReceiptPage.js             # waitForSuccess, captureReceiptAndCertificate
  tests/
    login-flow.test.js         # TC-AUTH-01 (canonical)
    buy-flow.test.js           # TC-BUY-01 (canonical)
    login.test.js              # alias → login-flow.test.js
    project-buy-flow.js        # alias → buy-flow.test.js
scripts/
  project-buy-flow.js          # legacy monolithic buy (test:buy:script)
  explore-*.js, fill-*.js, dump-*.js, download-receipt-cert.js, inspect-device.js
apps/
  *.apk                        # gitignored; local only
  locators/                    # dumps / login-locators.json
  downloads/                   # receipt.png, certificate.png (gitignored)
FLOW_DOCUMENTATION.md          # flow/test design source of truth
wdio.conf.js                   # specs: ./src/tests/**/*.test.js
.env                           # secrets — never commit
.env.example                   # EMAIL, PASSWORD, MBANKING_*, STEP_PAUSE_MS, DEVICE_UDID
```

## package.json scripts

| Script | Meaning |
|--------|---------|
| `appium` | Appium `127.0.0.1:4723` relaxed-security CORS |
| `test:login` | WDIO `login-flow.test.js` |
| `test:buy` | WDIO `buy-flow.test.js` (POM) |
| `test:buy:wdio` | same as test:buy |
| `test:buy:script` | node legacy `scripts/project-buy-flow.js` |
| `inspect:device` | package/activity helper |

## Env keys (names only)

`APP_PACKAGE`, `APP_ACTIVITY`, `EMAIL`, `PASSWORD`, `APPIUM_HOST`, `APPIUM_PORT`, `DEVICE_UDID`, `APP_PATH`, `MBANKING_NUMBER`, `MBANKING_PIN`, `STEP_PAUSE_MS`, `FORCE_APP_INSTALL`, `START_APPIUM`, `HIDE_ANIMATION`

Sandbox mBANKING used in successful runs (also in flow docs): mobile `01772559986`, pin `1234` — treat as sandbox-only.

## Buy path (verified)

1. Force app foreground (`terminate` + `launch`)
2. Soft login if needed
3. Buy Shares tab (not project card text)
4. Open Cloud 9 (Inani) card — avoid oversized parent nodes (height > 900)
5. Buy shares now → Continue → Others (VISA) → Continue
6. WEBVIEW ShurjoPay → `#mbanking_style` → `#input-38` mobile / `#input-41` pin → Pay Now
7. Native success → View Receipt + View Share Certificate → screenshots

## Chat decisions timeline

1. User asked to run emulator “koro” → only AVD `Aungsha_Emu` exists → started that.
2. Asked where login/buy JS files are → listed `src/tests` + `scripts/project-buy-flow.js`.
3. Asked to restore old files → no git then; files already on disk.
4. Asked to use POM → refactored buy to page objects; rules: reuse, no dupes, SOLID, locators in pages, no hardcoded waits.
5. Asked to add pages/tests → added `PaymentGatewayPage`, `ReceiptPage`, `login-flow.test.js`, `buy-flow.test.js`.
6. Pushed to GitHub; removed `Co-authored-by: Cursor` so Contributors should not credit cursoragent (UI cache may lag; API already only imran2635).

## Coding preferences for future agents

- Extend `BasePage` helpers instead of new one-off gesture helpers.
- Buy orchestration lives in `buy-flow.test.js`; payment in `PaymentGatewayPage`; docs in `ReceiptPage`.
- Do not revive spawnSync wrapper as primary buy path.
- Update `FLOW_DOCUMENTATION.md` when npm scripts or page layout change.
- Git: never force-push unless user asks; never commit `.env`; strip Cursor co-author trailers if tooling injects them.

## Local device notes

- `adb devices` may show `emulator-5554` and physical `R83Y80R6PXY`.
- Default `DEVICE_UDID=emulator-5554` in `.env` for automation.
- Emulator binary: `%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe`

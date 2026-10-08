---
name: appium-wdio-mocha
description: >-
  WebdriverIO 9 + Mocha Appium test authoring (wdio.conf, specs, SessionFactory
  scripts). Use when writing or fixing *.test.js, npm test scripts, Mocha hooks,
  or /appium-wdio-mocha.
---

# WDIO + Mocha (Appium)

## Prefer

| Use case | Entry |
|----------|--------|
| Canonical regression | `tests/*.test.js` via `wdio run` |
| Long E2E / payment | `scripts/*` + flow **component** |
| Caps / session | `AppConfig` + `SessionFactory` / WDIO services |

## Spec pattern

```js
const BuyFlowComponent = require('../components/BuyFlowComponent');

describe('TC-BUY-01', () => {
  it('buys via SurjoPay', async () => {
    const buy = new BuyFlowComponent(driver); // or SessionFactory in before
    await buy.execute('surjoypay');
  });
});
```

- Locators stay in pages — tests only call components/pages
- Keep specs thin; heavy steps in components
- Match existing `login-flow.test.js` / `buy-flow.test.js` style

## npm

```powershell
npm.cmd run test:login
npm.cmd run test:buy
npm.cmd run test:buy:bkash
# scripts:
npm.cmd run test:withdraw:script
```

## Config notes

- Specs glob: `wdio.conf.js` → `./tests/**/*.test.js`
- Appium service / remote `127.0.0.1:4723`
- Timeouts must tolerate emulator + WEBVIEW (minutes, not seconds)

## Do not

- Put XPath strings in test files
- Spawn duplicate session factories inside every `it` without cleanup
- Commit screenshots/APKs from local runs

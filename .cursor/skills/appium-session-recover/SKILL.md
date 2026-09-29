---
name: appium-session-recover
description: >-
  Recover Appium UiAutomator2 sessions after instrumentation crash, socket hang
  up, or terminated session (post-WEBVIEW). Use when seeing instrumentation not
  running, cannot be proxied, session terminated, Home shell timeout after pay,
  or /appium-session-recover.
---

# Appium session recovery

## Symptoms

- `instrumentation process is not running (probably crashed)`
- `Could not proxy command … socket hang up`
- `A session is either terminated or not started`
- `Home shell did not appear after login` right after payment/receipt

## Standard recover

```js
async _recoverSession() {
  console.log('[…] Recovering Appium session…');
  try { await this.driver.deleteSession(); } catch { /* dead */ }
  await new Promise((r) => setTimeout(r, 3000));
  const fresh = await SessionFactory.createStandalone();
  this._bind(fresh); // rebind pages/components + DriverManager.setDriver
  try {
    await this.driver.activateApp(appConfig.appPackage);
  } catch {
    await DriverManager.launchApp();
  }
  await this.driver.pause(4000);
}
```

## Where to call

| Moment | Component |
|--------|-----------|
| After buy / before withdraw | `WithdrawFlowComponent` |
| Receipt wait fails | `BuyFlowComponent._captureDocs` |
| Login wait / Home shell fails | `BuyFlowComponent._login` |
| `openWithdraw` fails | `_openWithdrawWithRetry` (max 3) |

## Retry wrapper

```js
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    await action();
    return;
  } catch (err) {
    const msg = String(err?.message || err);
    if (attempt < 2 && /instrumentation|terminated|not started|cannot be proxied|socket hang up|Home shell/i.test(msg)) {
      await this._recoverSession();
      continue;
    }
    throw err;
  }
}
```

## Ops tips

- Confirm Appium still listening: port `4723`
- `adb devices` shows `emulator-5554`
- Force-stop app only when starting clean login: `adb shell am force-stop com.aungsha.app`
- Prefer `activateApp` over full reinstall
- Do not burn long `waitUntil` on a dead session — recover first

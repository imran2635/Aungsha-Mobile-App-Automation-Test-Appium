---
name: appium-mobile
description: >-
  Appium 2 + UiAutomator2 + WebdriverIO 9 Android mobile automation playbook
  (setup, run, env, emulator, diagnostics, Aungsha flows). Use when doing
  Appium/WDIO mobile tests, emulator runs, buy/withdraw/login scripts, or when
  the user mentions Appium, UiAutomator2, mobile automation, or /appium-mobile.
---

# Appium mobile testing (Android)

## When invoked

1. Read [reference.md](reference.md) for env keys, scripts, and failure playbook.
2. Prefer POM pages + flow components over new one-off scripts.
3. For Aungsha project context pack, also load `/compet`.

## Related skills (load as needed)

| Skill | Use for |
|-------|---------|
| `appium-skills-index` | Full skill list by task |
| `appium-pom` | Page Object / OOP rules, file layout |
| `appium-locators` | Flutter semantics, dumps, forced coords |
| `appium-emulator-adb` | AVD, adb, force-stop, dump |
| `appium-wdio-mocha` | Mocha specs / npm test scripts |
| `appium-webview` | Chrome Custom Tab / WEBVIEW payments |
| `appium-session-recover` | UIA2 crash / socket hang up recovery |
| `appium-debug` | Flaky run triage |
| `appium-env-credentials` | Env key names |
| `appium-flows-aungsha` | Verified buy/withdraw paths |
| `compet` | Full Aungsha repo map + chat decisions |

## Stack defaults (this repo)

- Appium 2 + `appium-uiautomator2-driver` + WebdriverIO 9 + Mocha
- Package: `com.aungsha.app`
- Emulator: `emulator-5554` / AVD `Aungsha_Emu`
- Appium: `127.0.0.1:4723` (`npm.cmd run appium`)

## Pre-flight checklist

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path = "$env:ANDROID_HOME\platform-tools;$env:Path"
adb devices
# Appium must be up on 4723
npm.cmd run appium
```

## Canonical run commands

```powershell
$env:DEVICE_UDID = "emulator-5554"
npm.cmd run test:login
npm.cmd run test:buy
npm.cmd run test:buy:bkash:script
npm.cmd run test:buy:surjoypay:script
npm.cmd run test:withdraw:script
# Withdraw only (no buy):
$env:SKIP_BUY = "1"; $env:WITHDRAW_AMOUNT = "500"; node .\scripts\withdrawal-flow.js
```

## Architecture (must follow)

```
scripts/*.js          → thin CLI (env + SessionFactory)
services/*            → flows + DriverManager + AppConfig (Buy / Withdraw)
pages/*               → locators + UI actions only
tests/*               → WDIO / Mocha specs
scripts/*             → CLI runners (test:buy:script, etc.)
```

## Hard rules

- Locators only inside page classes.
- Reuse `BasePage` (`show`, `tap`, `tapAt`, `isVisible`, `findFirst`) — no duplicate helpers.
- No secrets in git; never commit `.env` / APKs.
- Prefer Bangla/Banglish short replies when the user writes that way.
- Never add `Co-authored-by: Cursor` on commits.

## Emulator visibility

Use `STEP_PAUSE_MS=1800`–`2200` so taps are watchable. Set `0` for speed.

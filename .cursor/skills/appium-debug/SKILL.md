---
name: appium-debug
description: >-
  Debug flaky Appium Android runs — screenshots, page source, UI dump, Appium
  logs, logcat hints. Use when a step fails on emulator, element not found,
  wrong screen, or /appium-debug.
---

# Appium debug playbook

## Fast triage order

1. Confirm Appium up (`4723`) + `adb devices` shows target UDID
2. Note last `[EMU] …` / component log line (which step died)
3. Dump UI **on that screen** and list labels
4. Screenshot for visual proof
5. If `instrumentation` / `terminated` → load `/appium-session-recover`

## Dump + labels

```powershell
adb -s emulator-5554 shell uiautomator dump /sdcard/window_dump.xml
adb -s emulator-5554 pull /sdcard/window_dump.xml .\apps\downloads\ui-dump.xml
node .\scripts\tools\_ui-labels.js .\apps\downloads\ui-dump.xml
```

## In-code helpers

```js
await DriverManager.takeScreenshot('fail-step'); // if available
await driver.getPageSource(); // save under apps/downloads when needed
await this.show('checkpoint label'); // STEP_PAUSE_MS visible pause
```

## Common root causes

| Log / symptom | Likely cause |
|---------------|--------------|
| Element not found | Wrong screen / need scroll / title vs CTA |
| Multiple Withdraw | Tapped title or bottom nav — use clickable ImageView |
| WEBVIEW gone | Payment finished — recover + native wait |
| Home shell timeout | Session dead or still on overlay — back + recover |
| Slow then fail | Increase wait; check Appium still alive |

## Fix path

Update **page** locators from dump → forced coords fallback → re-run with `STEP_PAUSE_MS=2200`.

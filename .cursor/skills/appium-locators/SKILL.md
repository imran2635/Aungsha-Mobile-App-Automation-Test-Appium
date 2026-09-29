---
name: appium-locators
description: >-
  Flutter/Android Appium locator strategy — content-desc, dumps, scroll,
  forced clickGesture coords. Use when elements are missing, Inspector/dump
  needed, Flutter Semantics, or forced taps; or user says locator, dump, xpath,
  content-desc, /appium-locators.
---

# Appium locators (Flutter / Android)

## Prefer order

1. Accessibility id: `~Label` (= `@content-desc`)
2. Exact: `//*[@content-desc="Label"]`
3. Contains: `//*[contains(@content-desc,"partial")]`
4. Class + desc: `//android.widget.ImageView[@content-desc="Withdraw"]`
5. `clickable="true"` when multiple same labels
6. **Forced** `tapAt(x, y)` / `mobile: clickGesture` last

## Flutter notes

- Most tappable nodes are `android.view.View` or `ImageView` with `content-desc`
- `EditText` for inputs; `clearValue` often fails — click + `mobile: type`
- Same label can appear as **title** (not clickable) and **CTA** (clickable) — always prefer `@clickable="true"`

## Aungsha traps

| Wrong | Right |
|-------|--------|
| First `~Withdraw` on Fund screen | `ImageView[@content-desc="Withdraw" and @clickable="true"]` |
| Bottom nav Withdraw as Fund CTA | Fund screen mid CTA ~ bounds `[95,679][527,779]` |
| Huge Marketplace card | Skip nodes with height > 900 |

## Dump workflow

```powershell
adb -s emulator-5554 shell uiautomator dump /sdcard/window_dump.xml
adb -s emulator-5554 pull /sdcard/window_dump.xml .\apps\downloads\ui-dump.xml
node .\scripts\tools\_ui-labels.js .\apps\downloads\ui-dump.xml
```

Update the **page class** from dump — do not hardcode one-off selectors in the chat script.

## Forced coords pattern

```js
try {
  await this.tap(this.selectors, 15000);
} catch {
  await this.tapAt(311, 729); // document screen size assumption
  await this.show('… coords (forced)');
}
```

Document coords relative to **1080×2400** emulator unless dump says otherwise.

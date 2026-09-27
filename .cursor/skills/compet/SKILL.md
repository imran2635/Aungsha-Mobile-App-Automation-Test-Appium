---
name: compet
description: >-
  Loads full Aungsha Mobile App Automation context (codebase map, POM rules,
  login/buy flows, run commands, env keys, GitHub/git preferences) from prior
  work with the user. Use when the user says /compet, compet, continues Aungsha
  Appium/WebdriverIO work on another machine/chat, or asks to restore project
  context / "sob data".
---

# /compet — Aungsha automation context pack

## User intent (verbatim)

ami tomar sathe ja kotha boltese and full codebase jeno pore kothao run korle sob data pai

## When invoked

1. Read [reference.md](reference.md) immediately.
2. Prefer existing POM pages/tests over new scripts.
3. Answer and code as if this chat’s decisions and repo layout are already known.
4. Do not re-ask for stack, flows, or file locations already listed below / in reference.

## Hard rules (from this project’s chats)

- Reuse existing classes and methods. No duplicate code or duplicate methods.
- Separate Page Objects, Test Cases, and Utilities. Locators stay inside page classes only.
- Follow OOP + POM + SOLID. Inheritance via `BasePage`.
- Minimum code for the task. Do not rewrite unchanged code or dump full files unless asked.
- No hardcoded waits — use `show()`, `isVisible()`, `findFirst()`, `waitUntil`, `STEP_PAUSE_MS`.
- Never commit `.env`, APKs, or secrets. Never add `Co-authored-by: Cursor` / cursoragent on GitHub.
- Emulator AVD name in docs: `Aungsha_Emu` (user once said “koro”; only this AVD exists).
- Prefer Bangla/Banglish short replies when the user writes that way.

## Stack

- Appium 2 + UiAutomator2 + WebdriverIO 9 + Mocha
- App: `com.aungsha.app`
- Device: emulator `emulator-5554` (AVD `Aungsha_Emu`) and/or physical tablet

## Run (Windows PowerShell)

```powershell
npm.cmd run appium
& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd Aungsha_Emu
npm.cmd run test:login
npm.cmd run test:buy
```

Legacy non-POM: `npm.cmd run test:buy:script`

## Key paths

| Role | Path |
|------|------|
| Login test | `src/tests/login-flow.test.js` |
| Buy test | `src/tests/buy-flow.test.js` |
| Pages | `src/pages/*.js` |
| Config | `src/config/AppConfig.js` |
| Driver | `src/core/DriverManager.js` |
| Docs | `FLOW_DOCUMENTATION.md` |
| GitHub | `https://github.com/imran2635/imran2635-Aungsha-Mobile-App-Automation-Test-Appium` |

## Flows to know

- **TC-AUTH-01**: `LoginPage.login` → `HomePage.waitUntilLoaded`
- **TC-BUY-01**: `ensureLoggedIn` → Buy Shares → Cloud 9 → Continue → Others → mBANKING WEBVIEW → receipt/certificate screenshots under `apps/downloads/`

## More detail

See [reference.md](reference.md) for full tree, env keys, page method map, and chat decisions.

---
name: appium-skills-index
description: >-
  Index of all Appium mobile testing Cursor skills for this project. Use when
  the user asks which skills to load, install mobile skills, or says
  /appium-skills-index / mobile testing skills.
---

# Appium mobile skills — index

Load with `/skill-name` in chat. Project path: `.cursor/skills/`. Also synced to personal Agent Store.

## Core (always useful)

| Skill | Purpose |
|-------|---------|
| `/compet` | Full Aungsha context pack + decisions |
| `/appium-mobile` | Umbrella: stack, run cmds, architecture |
| `/appium-pom` | Page Object / OOP rules |
| `/appium-locators` | Find/fix Flutter-Android locators |
| `/appium-emulator-adb` | Emulator, adb, dump, force-stop |
| `/appium-wdio-mocha` | WDIO Mocha specs & npm test |
| `/appium-webview` | ShurjoPay / bKash WEBVIEW |
| `/appium-session-recover` | UIA2 crash recovery |
| `/appium-debug` | Flaky run triage |
| `/appium-env-credentials` | Env keys (no secrets in git) |
| `/appium-flows-aungsha` | Verified login/buy/withdraw paths |

## What to load by task

| Task | Skills |
|------|--------|
| New page / locator | `appium-locators` + `appium-pom` |
| Emulator down | `appium-emulator-adb` |
| Payment gateway | `appium-webview` + `appium-session-recover` |
| Withdraw/buy run | `appium-flows-aungsha` + `compet` |
| Test file | `appium-wdio-mocha` + `appium-pom` |
| Failed run | `appium-debug` → then recover/locators |

## Not mobile Appium

`/aungsha-web` — Playwright **web** automation (separate).

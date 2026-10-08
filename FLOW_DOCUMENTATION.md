# Aungsha Mobile App — Flow Documentation

> End-to-end **UI automation** flows, test cases, test data, and screen/gateway touchpoints for the Aungsha Android app.

[![Platform](https://img.shields.io/badge/platform-Android-3DDC84?logo=android&logoColor=white)](#)
[![Appium](https://img.shields.io/badge/Appium-2.x-662d91)](#)
[![WebdriverIO](https://img.shields.io/badge/WebdriverIO-9.x-ea5906)](#)
[![Pattern](https://img.shields.io/badge/pattern-POM%20%2B%20OOP-0A66C2)](#)

| | |
|---|---|
| **Document type** | Flow / Test Design Spec |
| **Application** | Aungsha (`com.aungsha.app`) |
| **App version under test** | `aungsha_8oct.apk` (`apps/aungsha_8oct.apk`) |
| **Automation stack** | Appium 2 · UiAutomator2 · WebdriverIO · Mocha |
| **Primary device** | Emulator `emulator-5554` (AVD: `Aungsha_Emu`) |
| **Document version** | `1.3` |
| **Last updated** | 2026-10-08 |

---

## Run commands (copy-paste)

> Use **`npm.cmd`** on Windows PowerShell (avoids `npx` execution-policy errors).

### 1) Appium (Terminal A — keep running)

```powershell
cd e:\Aungsha-Mobile-App-Automation-Test
npm.cmd run appium
```

### 2) Emulator (if not already open)

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd Aungsha_Emu -gpu swiftshader_indirect
```

### 3) Login test

```powershell
cd e:\Aungsha-Mobile-App-Automation-Test
npm.cmd run test:login
```

### 4) Buy flow (Cloud 9 + mBanking + Receipt / Certificate) — one command

```powershell
cd e:\Aungsha-Mobile-App-Automation-Test
$env:MBANKING_NUMBER = "01772559986"
$env:MBANKING_PIN = "1234"
npm.cmd run test:buy:script
```

### 5) Buy flow via WDIO Mocha spec

```powershell
cd e:\Aungsha-Mobile-App-Automation-Test
npm.cmd run test:buy
```

### 6) Receipt + Certificate only

```powershell
cd e:\Aungsha-Mobile-App-Automation-Test
npm.cmd run test:receipt
```

| Goal | Command |
|------|---------|
| Start Appium | `npm.cmd run appium` |
| Login | `npm.cmd run test:login` |
| Buy + receipt (script) | `npm.cmd run test:buy:script` |
| Buy WDIO | `npm.cmd run test:buy` |
| Receipt only | `npm.cmd run test:receipt` |

---

## Table of contents

1. [Overview](#1-overview)
2. [Repository structure](#2-repository-structure)
3. [Architecture](#3-architecture)
4. [Scope at a glance](#4-scope-at-a-glance)
5. [Prerequisites & setup](#5-prerequisites--setup)
6. [How to run](#6-how-to-run)
7. [Flow endpoints (UI / gateway)](#7-flow-endpoints-ui--gateway)
8. [Verified / passed endpoints](#8-verified--passed-endpoints)
9. [Flow diagrams](#9-flow-diagrams)
10. [Test cases](#10-test-cases)
11. [Best / required test data](#11-best--required-test-data)
12. [Detailed step catalogue](#12-detailed-step-catalogue)
13. [Locators & page objects](#13-locators--page-objects)
14. [Artifacts & logs](#14-artifacts--logs)
15. [Pass / fail criteria](#15-pass--fail-criteria)
16. [Defects, risks & known issues](#16-defects-risks--known-issues)
17. [Staging checklist (for developers)](#17-staging-checklist-for-developers)
18. [Extending the suite](#18-extending-the-suite)
19. [Document control](#19-document-control)

---

## 1. Overview

### 1.1 Purpose

This document is the **single source of truth** for:

- What **flows** are automated
- How many **endpoints** (screens / gateway entry points) exist in those flows
- Which **test cases** are implemented vs backlog
- What **best test data** to use (sandbox only)
- How to **run**, **debug**, and **extend** tests

### 1.2 Important note about “endpoints”

This repo is **mobile UI E2E automation**, not a backend API test pack.

| Term in this doc | Meaning |
|------------------|---------|
| **Endpoint** | A user-journey **screen** or **payment gateway** step the automation interacts with |
| **Backend API** | Not listed here (embedded in the Flutter/Android app; not exposed as OpenAPI in this repo) |

### 1.3 Goals

| Goal | Description |
|------|-------------|
| Regression | Login + buy shares path stay green on emulator |
| Sandbox safety | Payments use **mBanking sandbox** only |
| Traceability | Cases map to steps, data, and pass criteria |
| GitHub-ready | Clear TOC, tables, diagrams for PR / wiki use |

---

## 2. Repository structure

```text
Aungsha-Mobile-App-Automation-Test/
├── FLOW_DOCUMENTATION.md          ← this file
├── package.json                   ← npm scripts (test:login, test:buy, appium)
├── wdio.conf.js                   ← WebdriverIO config
├── .env                           ← secrets/config (do not commit real prod secrets)
│
├── pages/                         ← Page Object Model (like Playwright pages/)
│   ├── BasePage.js
│   ├── LoginPage.js
│   ├── HomePage.js
│   ├── MarketplacePage.js
│   ├── ProjectBuyPage.js
│   ├── PaymentGatewayPage.js
│   ├── ReceiptPage.js
│   └── WithdrawPage.js
│
├── services/                      ← flows + driver + config (like Playwright services/)
│   ├── AppConfig.js
│   ├── DriverManager.js
│   ├── SessionFactory.js
│   ├── Checkpoint.js
│   ├── BuyFlowComponent.js
│   ├── WithdrawFlowComponent.js
│   ├── BaseFlowComponent.js
│   └── runStandaloneFlow.js
│
├── tests/                         ← WDIO / Mocha specs
│   ├── login-flow.test.js         ← TC-AUTH-01
│   ├── buy-flow.test.js           ← TC-BUY-01
│   ├── buy-bkash.test.js
│   └── helpers/describeBuyFlow.js
│
├── scripts/                       ← thin CLIs only
│   ├── withdrawal-flow.js
│   ├── project-buy-*.js / fund-balance-*.js
│   ├── download-receipt-cert.js
│   ├── run-pom-buy.js / run-with-banner.js
│   ├── tools/                     ← inspect-device, _ui-labels
│   └── legacy/                    ← explore/dump/fill helpers
│
├── artifacts/                     ← screenshots + logs (gitignored)
├── apps/
│   ├── locators/
│   └── downloads/
├── .cursor/skills/
└── wdio.conf.js / package.json / .env
```

### 2.1 npm scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `appium` | `npm.cmd run appium` | Start Appium on `127.0.0.1:4723` |
| `test:login` | `npm.cmd run test:login` | Run login WDIO spec (POM) |
| `test:buy` | `npm.cmd run test:buy` | Run buy WDIO POM spec |
| `test:buy:script` | `npm.cmd run test:buy:script` | Legacy node script (non-POM) |
| `test:buy:wdio` | `npm.cmd run test:buy:wdio` | Alias of `test:buy` |

> **Windows tip:** Prefer `npm.cmd` over `npx` if PowerShell blocks `.ps1` scripts.

---

## 3. Architecture

```text
┌─────────────────────────────────────────────────────────┐
│  Mocha / WDIO specs   (tests/*.js)                      │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Page Objects           (pages/*)                       │
│  BasePage → LoginPage / HomePage / Marketplace / Buy    │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  DriverManager + AppConfig                              │
│  capabilities, package/activity, .env                   │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Appium 2 + UiAutomator2  →  Android Emulator / Device  │
│  Aungsha app  →  (Secure Payment WebView) ShurjoPay     │
└─────────────────────────────────────────────────────────┘
```

**Design rules**

- Locators live in **page objects**, not scattered in raw tests (where POM is used)
- Prefer `mobile: clickGesture` / `mobile: type` for Flutter widgets
- Buy E2E lives mainly in `scripts/project-buy-flow.js` for reliability and logging

---

## 4. Scope at a glance

| Metric | Count | Details |
|--------|------:|---------|
| Automated suites | **2** | Authentication · Project purchase |
| Automated test cases | **2** | TC-AUTH-01 · TC-BUY-01 |
| Documented UI flows | **2** | Login · Buy → mBanking → docs |
| UI / gateway endpoints | **12** | 5 auth + 7 buy/pay/docs |
| **Endpoints verified PASS** | **12 / 12** (+ buy **46/46** checkpoints, 2026-10-08) | See [§8](#8-verified--passed-endpoints) |
| Payment methods automated | **1** | Others → ShurjoPay → **mBANKING** |
| Projects exercised | **1** | **Cloud 9 (Inani)** |
| Backlog cases (recommended) | **6** | See §10.2 |

---

## 5. Prerequisites & setup

### 5.1 Tooling

| Tool | Requirement |
|------|-------------|
| Node.js | LTS recommended |
| Android SDK | `platform-tools`, emulator |
| Appium | 2.x + `uiautomator2` driver |
| AVD | e.g. `Aungsha_Emu` |

### 5.2 App under test

| Key | Value |
|-----|-------|
| Package | `com.aungsha.app` |
| Activity | `com.aungsha.app.MainActivity` |
| Sample build | `apps/aungsha-tablet-staging.apk` |

### 5.3 First-time install

```powershell
cd e:\Aungsha-Mobile-App-Test
npm.cmd install
```

Copy / edit `.env` (see [§10.4](#104-environment-variables-env)).

---

## 6. How to run

### 6.1 Start Appium (Terminal A)

```powershell
cd e:\Aungsha-Mobile-App-Test; npm.cmd run appium
```

### 6.2 Start emulator (if needed)

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd Aungsha_Emu
```

### 6.3 Run tests (Terminal B)

```powershell
# Login only
cd e:\Aungsha-Mobile-App-Test; npm.cmd run test:login

# Buy + receipt + share certificate (one command)
cd e:\Aungsha-Mobile-App-Test; npm.cmd run test:buy
```

### 6.4 Optional visibility

| Variable | Effect |
|----------|--------|
| `STEP_PAUSE_MS=1800` | Pause between login UI steps (easier to watch on emulator) |
| `STEP_PAUSE_MS=0` | Fastest login |
| `FORCE_APP_INSTALL=1` | Reinstall APK from `APP_PATH` on session start |

---

## 7. Flow endpoints (UI / gateway)

**Total: 12 endpoints**

### 7.1 Authentication flow — 5 endpoints

| ID | Endpoint (screen) | Actor action | Expected result |
|----|-------------------|--------------|-----------------|
| **A1** | App launch | Cold / warm start | `com.aungsha.app` in foreground |
| **A2** | Profile | Open Profile tab | Profile UI |
| **A3** | Sign In entry | Tap **Sign In** | Login form |
| **A4** | Email login form | Email + password → **Sign in** | Auth request succeeds |
| **A5** | Home (authenticated) | Land on Home | `Buy Shares` / `Marketplace` / `Net Worth` |

### 7.2 Buy · payment · documents — 7 endpoints

| ID | Endpoint (screen / gateway) | Actor action | Expected result |
|----|----------------------------|--------------|-----------------|
| **B1** | Buy Shares tab | Open tab | Project cards list |
| **B2** | Cloud 9 (Inani) detail | Card → **Buy shares now** | Purchase Details |
| **B3** | Purchase Details | **Continue** | Choose payment method |
| **B4** | Payment method | **Others (VISA + more)** → **Continue** | Secure Payment WebView |
| **B5** | ShurjoPay → **mBANKING** | Mobile + PIN → Pay Now | Sandbox payment accepted |
| **B6** | Success → View Receipt | Open + Download | Receipt artifact |
| **B7** | Success → View Share Certificate | Open + Download | Certificate artifact |

### 7.3 External gateway detail

| Gateway | When it appears | Tabs | Automated path |
|---------|-----------------|------|-----------------|
| **ShurjoPay** WebView | After Others → Continue | CARDS · **mBANKING** · iBANKING | mBANKING |
| Mobile Number field | mBANKING form | `#input-38` (`maxlength=11`) | `01772559986` |
| Pin Number field | mBANKING form | `#input-41` | `1234` |
| Pay control | Form complete | `button.paynow_btn` | Click when enabled |

### 7.4 Payment options on app (not all automated)

| Method | UI label (approx.) | Automated? |
|--------|--------------------|------------|
| bKash | Recommended · fee shown | No (backlog) |
| Others | VISA + more · fee shown | **Yes** → ShurjoPay |

---

## 8. Verified / passed endpoints

> Latest evidence: **2026-10-08** on `emulator-5554` / AVD `Aungsha_Emu`.  
> Commands: `npm.cmd run test:login` · `npm.cmd run test:buy:script`  
> Buy result: **`RESULT: PASSED — Buy Flow mBANKING`** · checkpoints **46 PASSED / 0 FAILED** · exit `0`.

### 8.1 Summary

| Suite | Run | Checkpoints / endpoints | Passed | Failed | Coverage |
|-------|-----|------------------------:|-------:|-------:|----------|
| TC-AUTH-01 (Login) | `test:login` | 6 checkpoints | **6** | 0 | 100% |
| TC-BUY-01 (Buy + mBANKING + docs) | `test:buy:script` | 46 checkpoints | **46** | 0 | 100% |
| Logical endpoints (A1–A5, B1–B7) | both | **12** | **12** | 0 | 100% |

### 8.2 Authentication — passed checklist

| ID | Endpoint | Checked by | Result | Evidence (2026-10-08) |
|----|----------|------------|--------|------------------------|
| **A1** | App launch | `DriverManager` / session | ✅ PASS | `[PASSED] Launch app` / `Create Appium session` |
| **A2** | Profile | `LoginPage.openProfile` | ✅ PASS | `[PASSED] Open Profile` · `Profile opened` |
| **A3** | Sign In entry | Tap **Sign In** | ✅ PASS | `[PASSED] Opened Sign In screen` |
| **A4** | Email login form | Email + password + **Sign in** | ✅ PASS | `[PASSED] Enter email` · `Enter password` · `Tap Sign in` |
| **A5** | Home (authenticated) | Home shell | ✅ PASS | `[PASSED] Login` · soft login: `Already on main shell` / `Home shell loaded` |

**Login soft path** (`test:login`, already session):  
`Launch app` · `Credentials present in .env` · `Already on main shell` · `Ensure logged in (soft login)` · `Home shell loaded` · `Assert user is logged in` → **6/6 PASSED**.

### 8.3 Buy · payment · documents — passed checklist

| ID | Endpoint | Checked by | Result | Evidence (2026-10-08) |
|----|----------|------------|--------|------------------------|
| **B1** | Buy Shares tab | `MarketplacePage.openBuyShares` | ✅ PASS | `[PASSED] Buy Shares tab (fallback)` · `Open Buy Shares tab` |
| **B2** | Cloud 9 (Inani) + Buy shares now | `openCloud9Inani` + `tapBuy` | ✅ PASS | `[PASSED] Opened: Cloud 9 (Inani)` · `Purchase Details` · `Tap Buy shares now` |
| **B3** | Purchase Details → Continue | `confirmPurchase` | ✅ PASS | `[PASSED] Continue / confirm` · `Confirm purchase` |
| **B4** | Others → Continue | payment chooser + Continue | ✅ PASS | `[PASSED] Others payment by coords` · `Confirm / Continue purchase` |
| **B5** | ShurjoPay mBANKING + Pay | WEBVIEW fill + Pay Now | ✅ PASS | `[PASSED] WEBVIEW — payment gateway` · `ShurjoPay mBANKING payment` |
| **B6** | View Receipt → Download | `ReceiptPage` | ✅ PASS | `[PASSED] Opened receipt` · `receipt download` |
| **B7** | View Share Certificate → Download | `ReceiptPage` | ✅ PASS | `[PASSED] Opened certificate` · `certificate download` |

### 8.4 Gateway field checks (passed)

| Check | Expected | Result |
|-------|----------|--------|
| WEBVIEW open | ShurjoPay gateway | ✅ PASS |
| mBANKING tab | `#mbanking_style` | ✅ PASS (`ShurjoPay mBANKING via #mbanking_style`) |
| Mobile number | `01772559986` | ✅ PASS (`ShurjoPay mBANKING mobile=01772559986`) |
| PIN | `1234` | ✅ PASS (`ShurjoPay mBANKING pin=1234`) |
| Pay Now | Submit | ✅ PASS (`ShurjoPay mBANKING Pay Now`) |
| Checkout | mbanking | ✅ PASS (`Checkout (mbanking)`) |
| Docs | Receipt + certificate | ✅ PASS (`Receipt + certificate captured`) |
| Flow end | Buy DONE | ✅ PASS (`Buy flow DONE`) |

### 8.5 Full checkpoint dump — Buy Flow mBANKING (2026-10-08)

> Source: `npm.cmd run test:buy:script` · **Total: 46 · PASSED: 46 · FAILED: 0**

| # | Checkpoint | Result |
|--:|------------|--------|
| 1 | Create Appium session | ✅ PASSED |
| 2 | Credentials + launch app | ✅ PASSED |
| 3 | Open Profile | ✅ PASSED |
| 4 | Profile opened | ✅ PASSED |
| 5 | Opened Profile | ✅ PASSED |
| 6 | Opened Sign In screen | ✅ PASSED |
| 7 | Login fields ready | ✅ PASSED |
| 8 | Email tab selected | ✅ PASSED |
| 9 | Open login screen | ✅ PASSED |
| 10 | Email typed: *(from `.env`)* | ✅ PASSED |
| 11 | Enter email | ✅ PASSED |
| 12 | Password typed | ✅ PASSED |
| 13 | Enter password | ✅ PASSED |
| 14 | Sign in tapped — wait for Home | ✅ PASSED |
| 15 | Tap Sign in | ✅ PASSED |
| 16 | Login | ✅ PASSED |
| 17 | Buy Shares tab (fallback) | ✅ PASSED |
| 18 | Open Buy Shares tab | ✅ PASSED |
| 19 | Looking for: Cloud 9 (Inani) | ✅ PASSED |
| 20 | Tapped card: Cloud 9 (Inani) | ✅ PASSED |
| 21 | Opened: Cloud 9 (Inani) | ✅ PASSED |
| 22 | Open project (Cloud 9 (Inani)) | ✅ PASSED |
| 23 | Purchase Details | ✅ PASSED |
| 24 | Tap Buy shares now | ✅ PASSED |
| 25 | Open project | ✅ PASSED |
| 26 | Continue / confirm | ✅ PASSED |
| 27 | Confirm / Continue purchase | ✅ PASSED |
| 28 | Confirm purchase | ✅ PASSED |
| 29 | Others payment by coords | ✅ PASSED |
| 30 | Continue / confirm | ✅ PASSED |
| 31 | Confirm / Continue purchase | ✅ PASSED |
| 32 | WEBVIEW — payment gateway | ✅ PASSED |
| 33 | ShurjoPay mBANKING via #mbanking_style | ✅ PASSED |
| 34 | ShurjoPay mBANKING mobile=01772559986 | ✅ PASSED |
| 35 | ShurjoPay mBANKING pin=1234 | ✅ PASSED |
| 36 | ShurjoPay mBANKING Pay Now | ✅ PASSED |
| 37 | ShurjoPay mBANKING payment | ✅ PASSED |
| 38 | Checkout (mbanking) | ✅ PASSED |
| 39 | Opened receipt | ✅ PASSED |
| 40 | receipt download | ✅ PASSED |
| 41 | Opened certificate | ✅ PASSED |
| 42 | certificate download | ✅ PASSED |
| 43 | Receipt + certificate captured | ✅ PASSED |
| 44 | Capture receipt + certificate | ✅ PASSED |
| 45 | Receipt / success | ✅ PASSED |
| 46 | Buy flow DONE | ✅ PASSED |

### 8.6 Not checked yet (backlog endpoints / cases)

| Item | Status |
|------|--------|
| bKash payment (`test:buy:bkash`) | Script exists — not in this PASS evidence pack |
| CARDS (Visa) sandbox endpoint | ❌ Not automated |
| iBANKING tab | ❌ Not automated |
| Invalid login / wrong PIN | ❌ Not automated |
| Phone login | ❌ Not automated |
| Fund → Withdraw | Automated separately (`test:withdraw:script`) — not in this buy run |

---

## 9. Flow diagrams

### 9.1 Login — TC-AUTH-01

```mermaid
flowchart TD
  A[A1 Launch app] --> B{Session logged in?}
  B -->|Yes| C[Optional Sign out - visible demo]
  B -->|No| D[A2 Profile]
  C --> D
  D --> E[A3 Sign In]
  E --> F[A4 Email + Password]
  F --> G[Tap Sign in]
  G --> H[A5 Home shell]
  H --> I[PASS TC-AUTH-01]
```

### 9.2 Buy + mBanking + documents — TC-BUY-01

```mermaid
flowchart TD
  A[App foreground + logged in] --> B[B1 Buy Shares]
  B --> C[B2 Cloud 9 Inani → Buy shares now]
  C --> D[B3 Purchase Details → Continue]
  D --> E[B4 Others → Continue]
  E --> F[Secure Payment WebView]
  F --> G[B5 mBANKING]
  G --> H[Mobile + PIN → Pay Now]
  H --> I[Share Purchased success]
  I --> J[B6 View Receipt → Download]
  I --> K[B7 View Share Certificate → Download]
  J --> L[PASS BUY_FLOW_OK + RECEIPT_CERT_OK]
  K --> L
```

---

## 10. Test cases

### 10.1 Implemented (automation) — 2 cases

#### TC-AUTH-01 — Valid email login

| Field | Value |
|-------|-------|
| **ID** | TC-AUTH-01 |
| **Priority** | P0 |
| **Type** | Positive |
| **Spec** | `tests/login-flow.test.js` |
| **Precondition** | App installed; emulator up; Appium up; valid `.env` credentials |
| **Steps** | Launch → (Sign out if needed) → Profile → Sign In → Email → Password → Sign in |
| **Expected** | Home shell visible; `isLoggedIn() === true` |
| **Data** | §10.2 |

#### TC-BUY-01 — Buy Cloud 9 via mBanking sandbox + docs

| Field | Value |
|-------|-------|
| **ID** | TC-BUY-01 |
| **Priority** | P0 |
| **Type** | Positive E2E |
| **Spec / script** | `tests/buy-flow.test.js` → `scripts/project-buy-flow.js` |
| **Precondition** | Logged-in session (or home shell); Cloud 9 buyable; sandbox payment on |
| **Steps** | Buy Shares → Cloud 9 → Buy shares now → Continue → Others → Continue → mBANKING → Pay → Receipt + Certificate |
| **Expected** | Console: `BUY_FLOW_OK`, `RECEIPT_CERT_OK`; exit code `0` |
| **Data** | §10.3 |

### 10.2 Recommended backlog — 6 cases

| ID | Title | Priority | Type |
|----|-------|----------|------|
| TC-AUTH-02 | Invalid password shows error | P1 | Negative |
| TC-AUTH-03 | Phone login happy path | P1 | Positive |
| TC-BUY-02 | Pay with bKash | P2 | Positive |
| TC-BUY-03 | Pay with CARDS sandbox | P1 | Positive |
| TC-BUY-04 | Guest cannot buy (locked / Sign In) | P1 | Negative |
| TC-BUY-05 | Wrong mBanking PIN fails gracefully | P1 | Negative |
| TC-BUY-06 | BACK from Secure Payment returns safely | P2 | Recovery |

---

## 11. Best / required test data

> **Rule:** Use **sandbox / staging** only. Never use production payment instruments for automation.

### 10.1 Device & app

| Data | Best value | Config key |
|------|------------|------------|
| UDID | `emulator-5554` | `DEVICE_UDID` |
| Package | `com.aungsha.app` | `APP_PACKAGE` |
| Activity | `com.aungsha.app.MainActivity` | `APP_ACTIVITY` |
| APK path | `apps/aungsha-tablet-staging.apk` | `APP_PATH` |

### 10.2 Login — best data

| Field | Best value | Notes |
|-------|------------|-------|
| Channel | **Email** | Default automation path |
| Email | `imran.bponi@gmail.com` | Verified test user |
| Password | `12345678` | Staging/sandbox |

### 10.3 Buy — best data

| Field | Best value | Notes |
|-------|------------|-------|
| Project | **Cloud 9 (Inani)** | Must remain listed & buyable |
| Payment rail | **Others** → ShurjoPay | Not bKash |
| Method | **mBANKING** | Automated |
| Mobile | `01772559986` | Sandbox |
| PIN | `1234` | Sandbox |
| Card (manual / future) | `4444 4444 4444 4444` | SurjoPay sandbox card path |

### 10.4 Environment variables (`.env`)

```env
APP_PACKAGE=com.aungsha.app
APP_ACTIVITY=com.aungsha.app.MainActivity
EMAIL=imran.bponi@gmail.com
PASSWORD=12345678
APPIUM_HOST=127.0.0.1
APPIUM_PORT=4723
DEVICE_UDID=emulator-5554
APP_PATH=E:\\Aungsha-Mobile-App-Test\\apps\\aungsha-tablet-staging.apk
MBANKING_NUMBER=01772559986
MBANKING_PIN=1234
STEP_PAUSE_MS=1800
```

### 10.5 Data matrix (quick)

| Case | Email | Password | Project | Pay path | Mobile | PIN |
|------|-------|----------|---------|----------|--------|-----|
| TC-AUTH-01 | `imran.bponi@gmail.com` | `12345678` | — | — | — | — |
| TC-BUY-01 | (session) | (session) | Cloud 9 (Inani) | Others → mBANKING | `01772559986` | `1234` |

---

## 12. Detailed step catalogue

### 11.1 TC-BUY-01 console milestones

| Step | UI | Log marker |
|------|----|------------|
| 1 | Launch | `1) App launched` |
| 2 | Shell / login | `2) On app shell / login` |
| 3 | Buy Shares | `3) Buy Shares tab` |
| 4 | Cloud 9 detail | `4) Opened Cloud 9 detail` |
| 5 | Purchase Details | `5) Purchase Details` |
| 6 | Payment method | `6) Payment method` |
| 7 | Others | `7) Selected Others` |
| 8 | Secure Payment | `8) Secure Payment / gateway` |
| 9 | mBANKING | `9a/9c/9d` |
| 10 | Pay | `10) Submitted mBANKING Pay Now` |
| 11 | Docs | `11) Opened View Receipt` / Certificate |
| End | | `BUY_FLOW_OK` · `RECEIPT_CERT_OK` · `DONE_PROJECT_BUY_FLOW` |

### 11.2 Critical UI labels (accessibility)

| Label | Where used |
|-------|------------|
| `Sign In` / `Sign in` | Auth entry / submit |
| `Email` | Login channel tab |
| `Buy Shares` | Bottom nav / card CTA |
| `Buy shares now` | Project detail CTA |
| `Continue` | Purchase & payment |
| `Others` (+ VISA) | Payment method |
| `View Receipt` | Success |
| `View Share Certificate` | Success |
| `Share Purchased!` | Success title |

---

## 13. Locators & page objects

| Page object | Responsibility |
|-------------|----------------|
| `BasePage` | `tap`, `type`, `isVisible`, optional `show()` pauses |
| `LoginPage` | Open login, email/password, optional sign-out for demo |
| `HomePage` | Home shell detection / logged-in check |
| `MarketplacePage` | Buy Shares tab, Cloud 9 open helpers |
| `ProjectBuyPage` | Buy CTA, Others, Surjo/sandbox helpers |

**Buy script selectors (gateway)**

| Field | Selector |
|-------|----------|
| Mobile | `#input-38` or `input[maxlength="11"]` |
| PIN | `#input-41` |
| mBANKING tab | `#mbanking_style` / `a[href="#mfs"]` |
| Pay | `button.paynow_btn` |

---

## 14. Artifacts & logs

| Artifact | Location | Purpose |
|----------|----------|---------|
| UI dumps | `apps/locators/flow-*.xml` | Debug screens |
| Gateway HTML | `apps/locators/flow-surjopay.html`, `flow-mbanking*.html` | WebView analysis |
| Receipt image | `apps/downloads/receipt.png` | Evidence |
| Certificate image | `apps/downloads/certificate.png` | Evidence |
| Buy log | `buy-flow-run.log` | CI/local trace |
| Login log | `login-run.log` | CI/local trace |

---

## 15. Pass / fail criteria

| Case | PASS | FAIL |
|------|------|------|
| TC-AUTH-01 | Home markers visible; logged-in assert true | Stuck on login / guest profile |
| TC-BUY-01 | Exit `0` + `BUY_FLOW_OK` + `RECEIPT_CERT_OK` | Cloud 9 missing, wrong PIN field, WebView fail, launcher instead of app |

---

## 16. Defects, risks & known issues

| # | Risk | Mitigation |
|---|------|------------|
| 1 | Same package name for staging/prod | Confirm sandbox payment before buy runs |
| 2 | Flutter flaky `setValue` | Use `mobile: type` + gestures |
| 3 | Mobile/PIN field swap | Always `#input-38` = mobile, `#input-41` = PIN |
| 4 | Oversized parent tap crashes UiAutomator2 | Prefer card with `ROI` + `Buy Shares` |
| 5 | Appium already on port 4723 | Don’t double-start WDIO Appium service (`START_APPIUM=1` only when needed) |
| 6 | PowerShell blocks `npx` | Use `npm.cmd` |

---

## 17. Staging checklist (for developers)

Ask engineering for:

- [ ] Latest **staging APK**
- [ ] Exact **package** + **main activity**
- [ ] `versionName` / `versionCode`
- [ ] Staging **login** credentials
- [ ] Confirmation: APK → **staging API** + **sandbox payment**
- [ ] mBanking sandbox **mobile + PIN**
- [ ] SurjoPay sandbox **card** (if card path needed)
- [ ] Confirm **Cloud 9 (Inani)** is buyable on that env

---

## 18. Extending the suite

1. Add locators to the correct **page object**
2. Add a Mocha case under `tests/` **or** a script under `scripts/`
3. Wire an `npm` script in `package.json`
4. Update **this document**: endpoint count, case table, data matrix
5. Keep secrets in `.env` (add `.env.example` without real passwords for GitHub)

### Suggested `.gitignore` entries (GitHub hygiene)

```gitignore
.env
node_modules/
apps/*.apk
apps/downloads/
*.log
screenshots/
artifacts/
```
---

## 19. Document control

| Version | Date | Authoring notes |
|---------|------|-----------------|
| 1.0 | 2026-09-21 | Initial: 12 endpoints, 2 cases, best data |
| 1.1 | 2026-09-21 | Expanded for GitHub: TOC, repo tree, architecture, matrices |
| 1.2 | 2026-09-21 | Added verified/passed endpoints (§8): **12/12 PASS** |
| 1.3 | 2026-10-08 | Re-verified on `aungsha_8oct.apk`: login 6/6 · buy mBANKING **46/46 PASSED** + full checkpoint dump (§8.5) |

---

### Quick reference card

| Need | Use |
|------|-----|
| Endpoints | **12** (A1–A5, B1–B7) |
| Verified PASS | **12 / 12** endpoints · buy checkpoints **46 / 46** (2026-10-08) |
| Automated cases | **2** (TC-AUTH-01, TC-BUY-01) |
| Buy command | `npm.cmd run test:buy:script` |
| Login command | `npm.cmd run test:login` |
| Sandbox pay | mBanking `01772559986` / `1234` |
| Project | Cloud 9 (Inani) |

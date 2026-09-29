# Appium mobile — reference

## Env keys (names only)

| Key | Purpose |
|-----|---------|
| `EMAIL` / `PASSWORD` | App login |
| `DEVICE_UDID` | `emulator-5554` default |
| `APP_PACKAGE` / `APP_ACTIVITY` | `com.aungsha.app` / `.MainActivity` |
| `APPIUM_HOST` / `APPIUM_PORT` | `127.0.0.1` / `4723` |
| `MBANKING_NUMBER` / `MBANKING_PIN` | ShurjoPay mBANKING |
| `BKASH_NUMBER` / `BKASH_OTP` / `BKASH_PIN` | bKash WEBVIEW |
| `WALLET_AMOUNT` | Purchase Details wallet credit |
| `RESUME_PURCHASE` | `1` = skip nav, stay on Purchase Details |
| `BUY_METHOD` | `surjoypay` / `mbanking` / `bkash` |
| `SKIP_BUY` | `1` = withdraw flow without buy |
| `SKIP_RECEIPT` | `1` = skip receipt capture after pay |
| `WITHDRAW_BKASH_NUMBER` / `WITHDRAW_AMOUNT` | Withdraw payout |
| `STEP_PAUSE_MS` | Emulator follow-along pause |
| `FORCE_APP_INSTALL` | Install APK when `APP_PATH` set |
| `HIDE_ANIMATION` | `1` disables window animation |

## npm scripts

| Script | What |
|--------|------|
| `appium` | Server 4723 |
| `test:login` | WDIO login POM |
| `test:buy` | WDIO buy mBANKING POM |
| `test:buy:bkash` | WDIO bKash test |
| `test:buy:script` | Legacy buy script |
| `test:buy:bkash:script` | bKash buy CLI |
| `test:buy:surjoypay:script` | Wallet + SurjoPay |
| `test:buy:bkash-fund:script` | Wallet + bKash |
| `test:withdraw:script` | Buy optional → Fund → Withdraw |
| `test:receipt` | Receipt/cert capture |
| `inspect:device` | Package/activity helper |

## Proven sandbox numbers (staging only)

- mBANKING / withdraw bKash: `01772559986` / pin `1234`
- bKash buy (worked): `01929918378` (OTP/PIN from env)
- Withdraw amount demo: `500`

## Flows

### SurjoPay buy

Login → Buy Shares → Cloud 9 → Continue → Others → SurjoPay WEBVIEW → mBANKING → success → (optional receipt)

### bKash buy

Same until Choose payment → bKash → WEBVIEW `#WALLET` → `#OTP` → `#PIN`

### Withdraw (Fund path)

Home → Fund (wallet: Available to Withdraw) → **ImageView** Withdraw CTA → bKash toggle → Continue to Amount → amount → Submit Withdrawal

Do **not** tap page title `Withdraw` or bottom-nav `Withdraw` as the CTA — use clickable `ImageView[@content-desc="Withdraw"]` (coords fallback ~`311,729` on 1080×2400).

## Failure playbook

| Symptom | Action |
|---------|--------|
| `instrumentation process is not running` | `_recoverSession()` via `SessionFactory.createStandalone()`; activate app; retry |
| `socket hang up` | Same recover; ensure Appium still on 4723 |
| `Home shell did not appear` | Recover session; `activateApp`; back out of overlays |
| WEBVIEW closed after PIN | Treat as OK for bKash; wait native success |
| Locator not found | Dump UI → update page; else `tapAt` forced coords |
| Wrong Withdraw tap | Prefer Fund screen ImageView CTA locators |

## Dump UI (Windows)

```powershell
adb -s emulator-5554 shell uiautomator dump /sdcard/window_dump.xml
adb -s emulator-5554 pull /sdcard/window_dump.xml .\apps\downloads\ui-dump.xml
node .\scripts\tools\_ui-labels.js .\apps\downloads\ui-dump.xml
```

## Caps notes

- `noReset: true` — keep login session across runs
- `newCommandTimeout: 360`
- Only set `appium:app` when `FORCE_APP_INSTALL=1`

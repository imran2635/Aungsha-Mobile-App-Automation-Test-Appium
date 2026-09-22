# Appium Inspector — Aungsha

## Installed
- Appium Inspector `2026.7.1` (Start Menu: **Appium Inspector**)
- Caps file: `apps/inspector-caps.json`
- Extracted locators: `apps/locators/`

## Start session
1. Keep Appium running: `npx appium --address 127.0.0.1 --port 4723 --relaxed-security --allow-cors`
2. Open **Appium Inspector**
3. Remote host: `127.0.0.1` / port: `4723` / path: `/`
4. Paste JSON from `apps/inspector-caps.json` → **Start Session**

## Login screen locators (found)

| Element | Best locator (WDIO) | XPath |
|--------|----------------------|-------|
| Email input | `//android.widget.EditText[not(@password="true")]` | same |
| Password input | `//android.widget.EditText[@password="true"]` | same |
| Submit | `~Sign in` | `//*[@content-desc="Sign in"]` |
| Profile entry CTA | `~Sign In` | `//*[@content-desc="Sign In"]` |
| Forgot password | `~Forgot password?` | `//*[@content-desc="Forgot password?"]` |

Note: Profile CTA is **Sign In** (capital I). Form submit is **Sign in** (lowercase i).

## Re-extract
```powershell
node .\scripts\extract-locators.js
```

# Aungsha Mobile App Test (Appium + JavaScript)

POM + OOP WebdriverIO/Appium project for **Aungsha** Android login automation.

## Stack
- Appium 2 + UiAutomator2
- WebdriverIO + Mocha
- Page Object Model (`LoginPage`, `HomePage` extend `BasePage`)
- Config via `.env`

## One-time setup

1. Enable **USB debugging** on the tablet and tap **Allow** when prompted.
2. Confirm device:

```powershell
adb devices
```

Must show `device` (not `unauthorized`).

3. Install project deps:

```powershell
cd e:\Aungsha-Mobile-App-Test
npm install
npx appium driver install uiautomator2
```

4. Put credentials in `.env` (already filled for your account):

```
EMAIL=imran.bponi@gmail.com
PASSWORD=********
APP_PACKAGE=com.aungsha.app
APP_ACTIVITY=.MainActivity
```

5. Install Aungsha on the tablet (Play Store or APK). Then detect package:

```powershell
npm run inspect:device
```

Update `APP_PACKAGE` / `APP_ACTIVITY` in `.env` if different.

## Run login test

```powershell
npm run test:login
```

Appium starts automatically via WDIO service.

## Project structure

```
src/
  config/AppConfig.js      # env + capabilities
  core/DriverManager.js    # session/app helpers
  pages/BasePage.js        # shared OOP base
  pages/LoginPage.js       # login POM
  pages/HomePage.js        # post-login POM
  tests/login.test.js      # login scenario
```

## If selectors fail

Flutter/React Native UIs often need accessibility labels from **Appium Inspector**. Update arrays in `LoginPage.js` / `HomePage.js`.

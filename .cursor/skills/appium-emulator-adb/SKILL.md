---
name: appium-emulator-adb
description: >-
  Android emulator and adb setup for Appium (AVD start, devices, force-stop,
  install APK, uiautomator dump). Use when emulator won't boot, adb offline,
  wrong device UDID, or user mentions emulator, adb, AVD, /appium-emulator-adb.
---

# Emulator + adb (Appium)

## Defaults (Aungsha)

- AVD: `Aungsha_Emu`
- UDID: `emulator-5554`
- SDK: `%LOCALAPPDATA%\Android\Sdk`

## Start stack

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:Path"

# Emulator (separate terminal)
& "$env:ANDROID_HOME\emulator\emulator.exe" -avd Aungsha_Emu

adb wait-for-device
adb devices
# Appium
npm.cmd run appium
```

## Common ops

```powershell
adb -s emulator-5554 shell am force-stop com.aungsha.app
adb -s emulator-5554 shell monkey -p com.aungsha.app -c android.intent.category.LAUNCHER 1
adb -s emulator-5554 uninstall io.appium.uiautomator2.server  # rare: reset UIA2
adb kill-server; adb start-server
```

## UI dump

```powershell
adb -s emulator-5554 shell uiautomator dump /sdcard/window_dump.xml
adb -s emulator-5554 pull /sdcard/window_dump.xml .\apps\downloads\ui-dump.xml
```

## Rules

- Always set `DEVICE_UDID` when multiple devices shown
- Prefer `activateApp` / force-stop over APK reinstall every run
- `FORCE_APP_INSTALL=1` + `APP_PATH` only when installing fresh build

const os = require('os');
require('dotenv').config();

/**
 * Central app/test configuration (OOP-friendly singleton-style export).
 * Supports Android (UiAutomator2) and iOS (XCUITest) via PLATFORM env.
 *
 * Recommended on Windows: PLATFORM=android (emulator / device).
 * iOS XCUITest needs macOS + Xcode — see docs/IOS_SETUP.md.
 */
class AppConfig {
  constructor() {
    this.platform = String(process.env.PLATFORM || 'android').toLowerCase();
    this.isIos = this.platform === 'ios' || this.platform === 'iphone';
    this.isAndroid = !this.isIos;

    // Android package / iOS bundle id (Flutter apps often share the same id)
    this.appPackage = process.env.APP_PACKAGE || 'com.aungsha.app';
    this.appActivity = process.env.APP_ACTIVITY || '.MainActivity';
    this.bundleId =
      process.env.IOS_BUNDLE_ID || process.env.BUNDLE_ID || this.appPackage;
    /** Unified app id for activateApp / terminateApp */
    this.appId = this.isIos ? this.bundleId : this.appPackage;

    this.email = process.env.EMAIL || '';
    this.password = process.env.PASSWORD || '';
    this.appiumHost = process.env.APPIUM_HOST || '127.0.0.1';
    this.appiumPort = Number(process.env.APPIUM_PORT || 4723);
    this.deviceUdid = process.env.DEVICE_UDID || '';
    this.appPath = process.env.APP_PATH || '';

    // Real iPhone signing (Mac + Apple Developer)
    this.xcodeOrgId = process.env.XCODE_ORG_ID || '';
    this.xcodeSigningId = process.env.XCODE_SIGNING_ID || 'iPhone Developer';
    this.updatedWdaBundleId = process.env.UPDATED_WDA_BUNDLE_ID || '';
    this.wdaLocalPort = Number(process.env.WDA_LOCAL_PORT || 8100);
  }

  getCredentials() {
    return {
      email: this.email,
      password: this.password,
    };
  }

  getMBankingCredentials() {
    return {
      number: process.env.MBANKING_NUMBER || '01772559986',
      pin: process.env.MBANKING_PIN || '1234',
    };
  }

  getBkashCredentials() {
    return {
      number: process.env.BKASH_NUMBER || '01770618575',
      otp: process.env.BKASH_OTP || '123456',
      pin: process.env.BKASH_PIN || '12121',
    };
  }

  getWithdrawalCredentials() {
    return {
      number: process.env.WITHDRAW_BKASH_NUMBER || '01772559986',
      amount: process.env.WITHDRAW_AMOUNT || '500',
    };
  }

  /**
   * Fail fast with a clear message (e.g. iOS on Windows).
   * Allow PLATFORM=ios on non-Mac only when ALLOW_IOS_REMOTE=1 (cloud grid).
   */
  assertRunnableHost() {
    if (!this.isIos) return;
    if (os.platform() === 'darwin') return;
    if (process.env.ALLOW_IOS_REMOTE === '1') return;

    throw new Error(
      [
        'PLATFORM=ios cannot run XCUITest on this OS (' + os.platform() + ').',
        'Best path on Windows: keep PLATFORM=android and use emulator Aungsha_Emu.',
        'For real iPhone: use a Mac (docs/IOS_SETUP.md) or a cloud device farm',
        'with ALLOW_IOS_REMOTE=1 + remote Appium host.',
      ].join(' ')
    );
  }

  getCapabilities() {
    this.assertRunnableHost();
    return this.isIos ? this._iosCapabilities() : this._androidCapabilities();
  }

  /** @private */
  _androidCapabilities() {
    const caps = {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': process.env.DEVICE_NAME || 'Android',
      'appium:appPackage': this.appPackage,
      'appium:appActivity': this.appActivity,
      'appium:noReset': true,
      'appium:fullReset': false,
      'appium:autoGrantPermissions': true,
      'appium:newCommandTimeout': 360,
      'appium:ignoreHiddenApiPolicyError': true,
      'appium:disableWindowAnimation': process.env.HIDE_ANIMATION === '1',
      'appium:skipServerInstallation': false,
      'appium:skipDeviceInitialization': false,
      'appium:uiautomator2ServerLaunchTimeout': 60000,
      'appium:adbExecTimeout': 60000,
    };

    if (this.appPath && process.env.FORCE_APP_INSTALL === '1') {
      caps['appium:app'] = this.appPath;
    }
    if (this.deviceUdid) {
      caps['appium:udid'] = this.deviceUdid;
    }
    return caps;
  }

  /** @private */
  _iosCapabilities() {
    const caps = {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:deviceName': process.env.DEVICE_NAME || 'iPhone',
      'appium:bundleId': this.bundleId,
      'appium:noReset': true,
      'appium:fullReset': false,
      'appium:newCommandTimeout': 360,
      'appium:wdaLocalPort': this.wdaLocalPort,
      'appium:useNewWDA': process.env.USE_NEW_WDA === '1',
      'appium:usePrebuiltWDA': process.env.USE_PREBUILT_WDA === '1',
      'appium:skipLogCapture': true,
      // Real device often needs this for Safari/webview payments
      'appium:includeSafariInWebviews': true,
      'appium:webviewConnectTimeout': 20000,
    };

    if (this.deviceUdid) {
      caps['appium:udid'] = this.deviceUdid;
    }

    // Real iPhone — Apple Developer team + signing
    if (this.xcodeOrgId) {
      caps['appium:xcodeOrgId'] = this.xcodeOrgId;
      caps['appium:xcodeSigningId'] = this.xcodeSigningId;
    }
    if (this.updatedWdaBundleId) {
      caps['appium:updatedWDABundleId'] = this.updatedWdaBundleId;
    }

    // Optional .ipa install (usually app already installed on phone)
    if (this.appPath && process.env.FORCE_APP_INSTALL === '1') {
      caps['appium:app'] = this.appPath;
    }

    if (process.env.IOS_PLATFORM_VERSION) {
      caps['appium:platformVersion'] = process.env.IOS_PLATFORM_VERSION;
    }

    return caps;
  }
}

module.exports = new AppConfig();

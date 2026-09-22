require('dotenv').config();

/**
 * Central app/test configuration (OOP-friendly singleton-style export).
 */
class AppConfig {
  constructor() {
    this.appPackage = process.env.APP_PACKAGE || 'com.aungsha.app';
    this.appActivity = process.env.APP_ACTIVITY || '.MainActivity';
    this.email = process.env.EMAIL || '';
    this.password = process.env.PASSWORD || '';
    this.appiumHost = process.env.APPIUM_HOST || '127.0.0.1';
    this.appiumPort = Number(process.env.APPIUM_PORT || 4723);
    this.deviceUdid = process.env.DEVICE_UDID || '';
    this.appPath = process.env.APP_PATH || '';
  }

  getCredentials() {
    return {
      email: this.email,
      password: this.password,
    };
  }

  getMBankingCredentials() {
    return {
      number: process.env.MBANKING_NUMBER || '',
      pin: process.env.MBANKING_PIN || '',
    };
  }

  getCapabilities() {
    const caps = {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': 'Android',
      'appium:appPackage': this.appPackage,
      'appium:appActivity': this.appActivity,
      'appium:noReset': true,
      'appium:fullReset': false,
      'appium:autoGrantPermissions': true,
      'appium:newCommandTimeout': 240,
      'appium:ignoreHiddenApiPolicyError': true,
      // Keep animations so emulator UI changes are easier to follow
      'appium:disableWindowAnimation': process.env.HIDE_ANIMATION === '1',
      // Speed: skip slow UiAutomator2 settings dumps on cold start
      'appium:skipServerInstallation': false,
      'appium:skipDeviceInitialization': false,
      'appium:uiautomator2ServerLaunchTimeout': 60000,
      'appium:adbExecTimeout': 60000,
    };

    // Only install APK when explicitly requested — reinstall every run is slow
    if (this.appPath && process.env.FORCE_APP_INSTALL === '1') {
      caps['appium:app'] = this.appPath;
    }

    if (this.deviceUdid) {
      caps['appium:udid'] = this.deviceUdid;
    }

    return caps;
  }
}

module.exports = new AppConfig();

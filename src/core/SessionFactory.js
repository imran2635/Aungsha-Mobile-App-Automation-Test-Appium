const { remote } = require('webdriverio');
const appConfig = require('../config/AppConfig');

/**
 * Creates a standalone WebdriverIO session (CLI / non-WDIO runners).
 */
class SessionFactory {
  static async createStandalone() {
    const capabilities = {
      ...appConfig.getCapabilities(),
      'appium:newCommandTimeout': 420,
    };

    return remote({
      hostname: appConfig.appiumHost,
      port: appConfig.appiumPort,
      path: '/',
      capabilities,
      logLevel: 'warn',
    });
  }

  /**
   * Best-effort session teardown for CLI runners.
   * @param {WebdriverIO.Browser} driver
   */
  static async quitQuietly(driver) {
    if (!driver) return;
    try {
      await driver.switchContext('NATIVE_APP');
    } catch {
      // ignore
    }
    try {
      await driver.deleteSession();
    } catch {
      // ignore
    }
  }
}

module.exports = SessionFactory;

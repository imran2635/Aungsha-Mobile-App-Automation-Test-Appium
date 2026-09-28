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
}

module.exports = SessionFactory;

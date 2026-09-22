const appConfig = require('../config/AppConfig');

/**
 * DriverManager — OOP wrapper around WebdriverIO browser/session lifecycle.
 */
class DriverManager {
  constructor() {
    this.driver = null;
  }

  /**
   * WDIO injects global `browser`/`driver` for mobile sessions.
   * @param {WebdriverIO.Browser} browserInstance
   */
  setDriver(browserInstance) {
    this.driver = browserInstance;
    return this.driver;
  }

  getDriver() {
    if (!this.driver) {
      throw new Error('Driver is not initialized. Call setDriver(browser) first.');
    }
    return this.driver;
  }

  async launchApp() {
    const driver = this.getDriver();
    const { appPackage, appActivity } = appConfig;

    try {
      await driver.activateApp(appPackage);
    } catch {
      await driver.startActivity(appPackage, appActivity);
    }

    await driver.waitUntil(
      async () => {
        const state = await driver.queryAppState(appPackage);
        if (state === 4) {
          return true;
        }
        if (state === 3) {
          await driver.activateApp(appPackage);
        }
        try {
          const current = await driver.getCurrentPackage();
          return current === appPackage || current === 'com.google.android.permissioncontroller';
        } catch {
          return false;
        }
      },
      {
        timeout: 30000,
        interval: 700,
        timeoutMsg: `App ${appPackage} did not reach foreground`,
      }
    );
  }

  async terminateApp() {
    const driver = this.getDriver();
    try {
      await driver.terminateApp(appConfig.appPackage);
    } catch {
      // App may already be closed.
    }
  }

  async takeScreenshot(name = 'shot') {
    const driver = this.getDriver();
    const safe = name.replace(/[^a-z0-9_-]/gi, '_');
    const path = `./screenshots/${Date.now()}_${safe}.png`;
    await driver.saveScreenshot(path);
    return path;
  }
}

module.exports = new DriverManager();

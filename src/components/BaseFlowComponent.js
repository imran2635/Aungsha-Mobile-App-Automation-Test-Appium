const appConfig = require('../config/AppConfig');
const DriverManager = require('../core/DriverManager');
const SessionFactory = require('../core/SessionFactory');
const checkpoint = require('../core/Checkpoint');

/**
 * Shared OOP base for flow components (session + driver bind).
 * Subclasses implement `_bindPages(driver)` only — no duplicate recover logic.
 */
class BaseFlowComponent {
  /**
   * @param {WebdriverIO.Browser} driver
   */
  constructor(driver) {
    this.checkpoint = checkpoint;
    this._bind(driver);
  }

  /**
   * @param {WebdriverIO.Browser} driver
   * @protected
   */
  _bind(driver) {
    this.driver = driver;
    DriverManager.setDriver(driver);
    this._bindPages(driver);
  }

  /**
   * Re-create page/component references after a new session.
   * @param {WebdriverIO.Browser} _driver
   * @protected
   */
  _bindPages(_driver) {
    throw new Error(`${this.constructor.name} must implement _bindPages(driver)`);
  }

  /**
   * @param {unknown} err
   * @returns {boolean}
   */
  static isSessionError(err) {
    const msg = String(err && err.message ? err.message : err);
    return /instrumentation|terminated|not started|cannot be proxied|socket hang up|Home shell|success screen/i.test(
      msg
    );
  }

  /**
   * After WEBVIEW / UIA2 crash — delete session and recreate once.
   * @param {string} [label]
   */
  async recoverSession(label = '[Flow] Recovering Appium session…') {
    console.log(label);
    try {
      await this.driver.deleteSession();
    } catch {
      // already dead
    }
    await new Promise((r) => setTimeout(r, 3000));
    const fresh = await SessionFactory.createStandalone();
    this._bind(fresh);
    try {
      await this.driver.activateApp(appConfig.appPackage);
    } catch {
      await DriverManager.launchApp();
    }
    await this.driver.pause(4000);
  }

  /**
   * @param {() => Promise<void>} action
   * @param {{ attempts?: number, label?: string }} [opts]
   */
  async withSessionRetry(action, opts = {}) {
    const attempts = opts.attempts ?? 3;
    const label = opts.label || '[Flow] Recovering Appium session…';
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        await action();
        return;
      } catch (err) {
        if (attempt < attempts - 1 && BaseFlowComponent.isSessionError(err)) {
          await this.recoverSession(label);
          continue;
        }
        throw err;
      }
    }
  }
}

module.exports = BaseFlowComponent;

const appConfig = require('../config/AppConfig');
const DriverManager = require('../core/DriverManager');
const SessionFactory = require('../core/SessionFactory');
const BuyFlowComponent = require('./BuyFlowComponent');
const HomePage = require('../pages/HomePage');
const WithdrawPage = require('../pages/WithdrawPage');

/**
 * Project buy → Home → Withdraw (bKash) — OOP component (POM).
 *
 * Usage:
 *   const flow = new WithdrawFlowComponent(driver);
 *   await flow.execute();
 */
class WithdrawFlowComponent {
  /**
   * @param {WebdriverIO.Browser} driver
   */
  constructor(driver) {
    this._bind(driver);
  }

  /** @private */
  _bind(driver) {
    this.driver = driver;
    DriverManager.setDriver(driver);
    this.buy = new BuyFlowComponent(driver);
    this.homePage = new HomePage(driver);
    this.withdrawPage = new WithdrawPage(driver);
  }

  /**
   * After buy/receipt, UiAutomator2 often dies — recreate once.
   * @private
   */
  async _recoverSession() {
    console.log('[WithdrawFlow] Recovering Appium session…');
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

  /** @private */
  async _openWithdrawWithRetry() {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await this.homePage.openWithdraw();
        return;
      } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        if (
          attempt < 2 &&
          /instrumentation|terminated|not started|cannot be proxied|socket hang up|Home shell/i.test(
            msg
          )
        ) {
          await this._recoverSession();
          continue;
        }
        throw err;
      }
    }
  }

  /**
   * @param {{
   *   buyMethod?: 'mbanking'|'bkash'|'surjoypay',
   *   skipBuy?: boolean,
   *   number?: string,
   *   amount?: number|string,
   * }} [options]
   */
  async execute(options = {}) {
    const buyMethod = String(
      options.buyMethod || process.env.BUY_METHOD || 'surjoypay'
    ).toLowerCase();
    const skipBuy = options.skipBuy === true || process.env.SKIP_BUY === '1';
    const number =
      options.number ||
      process.env.WITHDRAW_BKASH_NUMBER ||
      appConfig.getWithdrawalCredentials().number;
    const amount =
      options.amount ||
      process.env.WITHDRAW_AMOUNT ||
      appConfig.getWithdrawalCredentials().amount;

    if (!skipBuy) {
      console.log(`[WithdrawFlow] Project buy (${buyMethod})`);
      await this.buy.execute(buyMethod);
      this._bind(this.buy.driver);
      // Fresh session after buy — receipt WEBVIEW often kills UIA2
      await this._recoverSession();
    } else {
      console.log('[WithdrawFlow] Skip buy — start from current session');
      try {
        await this.driver.activateApp(appConfig.appPackage);
      } catch {
        await this._recoverSession();
      }
    }

    console.log('[WithdrawFlow] Home → Fund → Withdraw');
    await this._openWithdrawWithRetry();

    console.log(`[WithdrawFlow] bKash ${number} → Amount ৳${amount} → Submit`);
    await this.withdrawPage.completeBkashWithdrawal({ number, amount });

    console.log('[WithdrawFlow] DONE');
  }
}

module.exports = WithdrawFlowComponent;

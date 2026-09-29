const appConfig = require('../config/AppConfig');
const BaseFlowComponent = require('./BaseFlowComponent');
const BuyFlowComponent = require('./BuyFlowComponent');
const HomePage = require('../pages/HomePage');
const WithdrawPage = require('../pages/WithdrawPage');

/**
 * Optional buy → Home → Fund → Withdraw (bKash) — OOP component (POM).
 *
 * Usage:
 *   const flow = new WithdrawFlowComponent(driver);
 *   await flow.execute();
 */
class WithdrawFlowComponent extends BaseFlowComponent {
  /** @param {WebdriverIO.Browser} driver */
  _bindPages(driver) {
    this.buy = new BuyFlowComponent(driver);
    this.homePage = new HomePage(driver);
    this.withdrawPage = new WithdrawPage(driver);
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
      await this.recoverSession('[WithdrawFlow] Recovering Appium session…');
    } else {
      console.log('[WithdrawFlow] Skip buy — start from current session');
      try {
        await this.driver.activateApp(appConfig.appPackage);
      } catch {
        await this.recoverSession('[WithdrawFlow] Recovering Appium session…');
      }
    }

    console.log('[WithdrawFlow] Home → Fund → Withdraw');
    await this.withSessionRetry(() => this.homePage.openFundThenWithdraw(), {
      label: '[WithdrawFlow] Recovering Appium session…',
    });

    console.log(`[WithdrawFlow] bKash ${number} → Amount ৳${amount} → Submit`);
    await this.withdrawPage.completeBkashWithdrawal({ number, amount });

    console.log('[WithdrawFlow] DONE');
  }
}

module.exports = WithdrawFlowComponent;

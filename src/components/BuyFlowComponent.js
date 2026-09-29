const appConfig = require('../config/AppConfig');
const DriverManager = require('../core/DriverManager');
const BaseFlowComponent = require('./BaseFlowComponent');
const LoginPage = require('../pages/LoginPage');
const HomePage = require('../pages/HomePage');
const MarketplacePage = require('../pages/MarketplacePage');
const ProjectBuyPage = require('../pages/ProjectBuyPage');
const PaymentGatewayPage = require('../pages/PaymentGatewayPage');
const ReceiptPage = require('../pages/ReceiptPage');

/**
 * Single OOP buy component (POM).
 * Composes page objects — locators stay in pages only.
 *
 * Usage:
 *   const buy = new BuyFlowComponent(driver);
 *   await buy.execute('mbanking'); // or 'bkash' | 'surjoypay'
 */
class BuyFlowComponent extends BaseFlowComponent {
  /** @param {WebdriverIO.Browser} driver */
  _bindPages(driver) {
    this.loginPage = new LoginPage(driver);
    this.homePage = new HomePage(driver);
    this.marketplacePage = new MarketplacePage(driver);
    this.projectBuyPage = new ProjectBuyPage(driver);
    this.paymentGatewayPage = new PaymentGatewayPage(driver);
    this.receiptPage = new ReceiptPage(driver);
  }

  /**
   * @param {'mbanking' | 'bkash' | 'surjoypay' | 'shurjopay'} [paymentMethod]
   * @param {{ walletAmount?: number|string, resumePurchase?: boolean }} [options]
   */
  async execute(paymentMethod = 'mbanking', options = {}) {
    const method = String(paymentMethod || 'mbanking').toLowerCase();
    const walletAmount = options.walletAmount ?? process.env.WALLET_AMOUNT;
    const resumePurchase =
      options.resumePurchase === true || process.env.RESUME_PURCHASE === '1';

    if (!resumePurchase) {
      const { email, password } = appConfig.getCredentials();
      if (!email || !password) {
        throw new Error('EMAIL / PASSWORD missing in .env');
      }
      await DriverManager.terminateApp();
      await DriverManager.launchApp();
      await this._login(email, password);
      await this._openCloud9();
    } else {
      console.log('[BuyFlowComponent] Resume from current Purchase Details');
      try {
        await this.driver.activateApp(appConfig.appPackage);
      } catch {
        // already foreground
      }
    }

    if (walletAmount) {
      console.log(`[BuyFlowComponent] Apply Wallet Balance ৳${walletAmount}`);
      await this.projectBuyPage.applyWalletBalance(walletAmount);
    }

    await this.projectBuyPage.confirmPurchase();
    await this._checkout(method);
    await this._captureDocs();
  }

  /** @private */
  async _login(email, password) {
    console.log('[BuyFlowComponent] Login');
    try {
      await this.loginPage.ensureLoggedIn(email, password);
      await this.homePage.waitUntilLoaded();
    } catch (err) {
      if (!BaseFlowComponent.isSessionError(err)) throw err;
      console.log('[BuyFlowComponent] Login wait failed — recovering session…');
      await this.recoverSession('[BuyFlowComponent] Recovering Appium session…');
      await this.loginPage.ensureLoggedIn(email, password);
      await this.homePage.waitUntilLoaded();
    }
  }

  /** @private */
  async _openCloud9() {
    console.log('[BuyFlowComponent] Marketplace → Cloud 9');
    await this.marketplacePage.openBuyShares();
    await this.marketplacePage.openCloud9Inani();
    await this.projectBuyPage.tapBuy();
  }

  /** @private */
  async _checkout(paymentMethod) {
    if (paymentMethod === 'bkash') {
      console.log('[BuyFlowComponent] Payment → bKash (forced)');
      await this.projectBuyPage.waitForPaymentChooser();
      await this.projectBuyPage.selectBkashPayment();
      await this.projectBuyPage.confirmPurchase();
      await this.driver.pause(4000);
      await this.paymentGatewayPage.completeBkashPayment(appConfig.getBkashCredentials());
      return;
    }

    console.log('[BuyFlowComponent] Payment → Others → ShurjoPay → mBANKING');
    await this.projectBuyPage.selectOthersPayment();
    await this.projectBuyPage.confirmPurchase();
    await this.projectBuyPage.selectSurjoPay();
    await this.driver.pause(6000);
    await this.paymentGatewayPage.completeMBankingPayment(appConfig.getMBankingCredentials());
  }

  /** @private */
  async _captureDocs() {
    if (process.env.SKIP_RECEIPT === '1') {
      console.log('[BuyFlowComponent] SKIP_RECEIPT — success wait only');
      await this.driver.pause(5000);
      try {
        await this.receiptPage.waitForSuccess(90000);
      } catch (err) {
        if (BaseFlowComponent.isSessionError(err)) {
          await this.recoverSession('[BuyFlowComponent] Recovering Appium session after gateway…');
        }
      }
      console.log('[BuyFlowComponent] DONE (no receipt capture)');
      return;
    }

    console.log('[BuyFlowComponent] Receipt + Certificate');
    await this.driver.pause(8000);
    try {
      await this.driver.switchContext('NATIVE_APP');
    } catch {
      // ignore
    }

    try {
      await this.receiptPage.waitForSuccess(90000);
    } catch (err) {
      if (!BaseFlowComponent.isSessionError(err)) throw err;
      await this.recoverSession('[BuyFlowComponent] Recovering Appium session after gateway…');
      await this.receiptPage.waitForSuccess(120000);
    }

    await this.receiptPage.captureReceiptAndCertificate();
    console.log('[BuyFlowComponent] DONE');
  }
}

module.exports = BuyFlowComponent;

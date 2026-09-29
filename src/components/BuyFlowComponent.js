const appConfig = require('../config/AppConfig');
const DriverManager = require('../core/DriverManager');
const SessionFactory = require('../core/SessionFactory');
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
 *   await buy.execute('mbanking'); // or 'bkash'
 */
class BuyFlowComponent {
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
    const resumePurchase = options.resumePurchase === true || process.env.RESUME_PURCHASE === '1';

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
      const msg = String(err && err.message ? err.message : err);
      if (
        !/instrumentation|terminated|not started|cannot be proxied|socket hang up|Home shell/i.test(
          msg
        )
      ) {
        throw err;
      }
      console.log('[BuyFlowComponent] Login wait failed — recovering session…');
      await this._recoverSession();
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
    // Stay on Purchase Details so wallet can be applied before Continue
  }

  /** @private */
  async _checkout(paymentMethod) {
    if (paymentMethod === 'bkash') {
      console.log('[BuyFlowComponent] Payment → bKash (forced)');
      // Wait for Choose payment method
      await this.driver.waitUntil(
        async () =>
          this.projectBuyPage.isVisible(
            [
              '//*[contains(@content-desc,"bKash")]',
              '//*[contains(@content-desc,"Choose payment")]',
              '//*[contains(@content-desc,"Others")]',
            ],
            2000
          ),
        { timeout: 30000, timeoutMsg: 'Payment method screen did not appear' }
      );
      await this.projectBuyPage.selectBkashPayment();
      await this.projectBuyPage.confirmPurchase();
      await this.driver.pause(4000);
      await this.paymentGatewayPage.completeBkashPayment(appConfig.getBkashCredentials());
      return;
    }

    // surjoypay / shurjopay / mbanking → Others → ShurjoPay WEBVIEW → mBANKING
    console.log('[BuyFlowComponent] Payment → Others → ShurjoPay → mBANKING');
    await this.projectBuyPage.selectOthersPayment();
    await this.projectBuyPage.confirmPurchase();
    await this.projectBuyPage.selectSurjoPay();
    await this.driver.pause(6000);
    await this.paymentGatewayPage.completeMBankingPayment(appConfig.getMBankingCredentials());
  }

  /**
   * After WEBVIEW payment, UiAutomator2 often crashes — recreate session once.
   * @private
   */
  async _recoverSession() {
    console.log('[BuyFlowComponent] Recovering Appium session after gateway…');
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
  async _captureDocs() {
    if (process.env.SKIP_RECEIPT === '1') {
      console.log('[BuyFlowComponent] SKIP_RECEIPT — success wait only');
      await this.driver.pause(5000);
      try {
        await this.receiptPage.waitForSuccess(90000);
      } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        if (/instrumentation|terminated|not started|cannot be proxied|success screen/i.test(msg)) {
          await this._recoverSession();
        }
      }
      console.log('[BuyFlowComponent] DONE (no receipt capture)');
      return;
    }

    console.log('[BuyFlowComponent] Receipt + Certificate');
    // Let Chrome Custom Tab / UIA2 settle after WEBVIEW pay
    await this.driver.pause(8000);
    try {
      await this.driver.switchContext('NATIVE_APP');
    } catch {
      // ignore
    }

    try {
      await this.receiptPage.waitForSuccess(90000);
    } catch (err) {
      const msg = String(err && err.message ? err.message : err);
      if (/instrumentation|terminated|not started|cannot be proxied|success screen/i.test(msg)) {
        await this._recoverSession();
        await this.receiptPage.waitForSuccess(120000);
      } else {
        throw err;
      }
    }

    await this.receiptPage.captureReceiptAndCertificate();
    console.log('[BuyFlowComponent] DONE');
  }
}

module.exports = BuyFlowComponent;

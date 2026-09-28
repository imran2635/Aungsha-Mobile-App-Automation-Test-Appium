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
   * @param {'mbanking' | 'bkash'} [paymentMethod]
   */
  async execute(paymentMethod = 'mbanking') {
    const { email, password } = appConfig.getCredentials();
    if (!email || !password) {
      throw new Error('EMAIL / PASSWORD missing in .env');
    }

    await DriverManager.terminateApp();
    await DriverManager.launchApp();

    await this._login(email, password);
    await this._openCloud9();
    await this._checkout(paymentMethod);
    await this._captureDocs();
  }

  /** @private */
  async _login(email, password) {
    console.log('[BuyFlowComponent] Login');
    await this.loginPage.ensureLoggedIn(email, password);
    await this.homePage.waitUntilLoaded();
  }

  /** @private */
  async _openCloud9() {
    console.log('[BuyFlowComponent] Marketplace → Cloud 9');
    await this.marketplacePage.openBuyShares();
    await this.marketplacePage.openCloud9Inani();
    await this.projectBuyPage.tapBuy();
    await this.projectBuyPage.confirmPurchase();
  }

  /** @private */
  async _checkout(paymentMethod) {
    if (paymentMethod === 'bkash') {
      console.log('[BuyFlowComponent] Payment → bKash');
      await this.projectBuyPage.selectBkashPayment();
      await this.projectBuyPage.confirmPurchase();
      await this.paymentGatewayPage.completeBkashPayment(appConfig.getBkashCredentials());
      return;
    }

    console.log('[BuyFlowComponent] Payment → Others → ShurjoPay → mBANKING');
    await this.projectBuyPage.selectOthersPayment();
    await this.projectBuyPage.confirmPurchase();
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
    await this.driver.pause(3000);
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

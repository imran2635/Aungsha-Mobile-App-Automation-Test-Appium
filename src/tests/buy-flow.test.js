const appConfig = require('../config/AppConfig');
const DriverManager = require('../core/DriverManager');
const LoginPage = require('../pages/LoginPage');
const HomePage = require('../pages/HomePage');
const MarketplacePage = require('../pages/MarketplacePage');
const ProjectBuyPage = require('../pages/ProjectBuyPage');
const PaymentGatewayPage = require('../pages/PaymentGatewayPage');
const ReceiptPage = require('../pages/ReceiptPage');

/**
 * TC-BUY-01 — Cloud 9 buy via mBANKING (POM).
 */
describe('Aungsha Buy Flow (POM)', () => {
  /** @type {LoginPage} */
  let loginPage;
  /** @type {HomePage} */
  let homePage;
  /** @type {MarketplacePage} */
  let marketplacePage;
  /** @type {ProjectBuyPage} */
  let projectBuyPage;
  /** @type {PaymentGatewayPage} */
  let paymentGatewayPage;
  /** @type {ReceiptPage} */
  let receiptPage;

  before(async () => {
    DriverManager.setDriver(browser);
    await DriverManager.terminateApp();
    await DriverManager.launchApp();
    loginPage = new LoginPage(browser);
    homePage = new HomePage(browser);
    marketplacePage = new MarketplacePage(browser);
    projectBuyPage = new ProjectBuyPage(browser);
    paymentGatewayPage = new PaymentGatewayPage(browser);
    receiptPage = new ReceiptPage(browser);
  });

  it('should buy Cloud 9 (Inani) via mBANKING sandbox', async () => {
    const { email, password } = appConfig.getCredentials();
    const mbanking = appConfig.getMBankingCredentials();

    expect(email).toBeTruthy();
    expect(password).toBeTruthy();
    expect(mbanking.number).toBeTruthy();
    expect(mbanking.pin).toBeTruthy();

    await loginPage.ensureLoggedIn(email, password);
    await homePage.waitUntilLoaded();

    await marketplacePage.openBuyShares();
    await marketplacePage.openCloud9Inani();

    await projectBuyPage.tapBuy();
    await projectBuyPage.confirmPurchase();
    await projectBuyPage.selectOthersPayment();
    await projectBuyPage.confirmPurchase();

    await paymentGatewayPage.completeMBankingPayment(mbanking);
    await receiptPage.waitForSuccess();
    await receiptPage.captureReceiptAndCertificate();
  });
});

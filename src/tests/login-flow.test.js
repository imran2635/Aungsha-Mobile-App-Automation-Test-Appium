const appConfig = require('../config/AppConfig');
const DriverManager = require('../core/DriverManager');
const LoginPage = require('../pages/LoginPage');
const HomePage = require('../pages/HomePage');

/**
 * TC-AUTH-01 — Valid email login (POM).
 */
describe('Aungsha Login Flow (POM)', () => {
  /** @type {LoginPage} */
  let loginPage;
  /** @type {HomePage} */
  let homePage;

  before(async () => {
    DriverManager.setDriver(browser);
    await DriverManager.launchApp();
    loginPage = new LoginPage(browser);
    homePage = new HomePage(browser);
    await loginPage.show('App launched');
  });

  it('should login successfully with valid credentials', async () => {
    const { email, password } = appConfig.getCredentials();

    expect(email).toBeTruthy();
    expect(password).toBeTruthy();

    await loginPage.login(email, password);
    await homePage.waitUntilLoaded();

    const loggedIn = await homePage.isLoggedIn();
    expect(loggedIn).toBe(true);
  });
});

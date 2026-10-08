const appConfig = require('../config/AppConfig');
const DriverManager = require('../core/DriverManager');
const checkpoint = require('../core/Checkpoint');
const LoginPage = require('../pages/LoginPage');
const HomePage = require('../pages/HomePage');

/**
 * TC-AUTH-01 — Valid email login (POM) with per-step PASSED/FAILED.
 */
describe('Aungsha Login Flow (POM)', () => {
  /** @type {LoginPage} */
  let loginPage;
  /** @type {HomePage} */
  let homePage;

  before(async () => {
    checkpoint.reset();
    await checkpoint.run('Launch app', async () => {
      DriverManager.setDriver(browser);
      await DriverManager.launchApp();
      loginPage = new LoginPage(browser);
      homePage = new HomePage(browser);
    });
  });

  after(async () => {
    checkpoint.summary();
  });

  it('should login successfully with valid credentials', async () => {
    await checkpoint.run('Credentials present in .env', async () => {
      const { email, password } = appConfig.getCredentials();
      expect(email).toBeTruthy();
      expect(password).toBeTruthy();
    });

    const { email, password } = appConfig.getCredentials();

    await checkpoint.run('Ensure logged in (soft login)', async () => {
      await loginPage.ensureLoggedIn(email, password);
    });

    await checkpoint.run('Home shell loaded', async () => {
      await homePage.waitUntilLoaded();
    });

    await checkpoint.run('Assert user is logged in', async () => {
      const loggedIn = await homePage.isLoggedIn();
      expect(loggedIn).toBe(true);
    });
  });
});

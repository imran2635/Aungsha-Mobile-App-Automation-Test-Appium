const BasePage = require('./BasePage');

/**
 * Post-login / home dashboard Page Object.
 */
class HomePage extends BasePage {
  constructor(driver) {
    super(driver);

    this.profileTab = ['~Profile'];
    this.homeShell = [
      '~Buy Shares',
      '~Marketplace',
      '~Home',
      '~Net Worth',
      '//*[contains(@content-desc,"Net Worth")]',
      '//*[contains(@content-desc,"Buy Shares")]',
    ];
    this.guestMarkers = [
      '~Sign In',
      '//*[contains(@content-desc,"Profile is locked")]',
    ];
    this.loginFormMarkers = [
      '//android.widget.EditText[@password="true"]',
      '~Sign in',
    ];
  }

  async openProfile() {
    await this.tap(this.profileTab, 8000);
  }

  /**
   * Fast check: home shell visible and login form gone.
   * Avoids opening Profile on every poll (that made emulator feel slow).
   */
  async isLoggedIn(timeout = 2000) {
    if (await this.isVisible(this.loginFormMarkers, 800)) {
      return false;
    }
    return this.isVisible(this.homeShell, timeout);
  }

  async waitUntilLoaded(timeout = 60000) {
    await this.driver.waitUntil(
      async () => {
        if (await this.isVisible(this.loginFormMarkers, 600)) {
          return false;
        }
        return this.isVisible(this.homeShell, 1200);
      },
      {
        timeout,
        interval: 800,
        timeoutMsg: 'Home shell did not appear after login',
      }
    );
  }

  /**
   * Optional stronger check — open Profile once and ensure not guest.
   */
  async assertAuthenticatedProfile(timeout = 8000) {
    await this.openProfile();
    const guest = await this.isVisible(this.guestMarkers, timeout);
    if (guest) {
      throw new Error('Still on guest profile after login');
    }
  }
}

module.exports = HomePage;

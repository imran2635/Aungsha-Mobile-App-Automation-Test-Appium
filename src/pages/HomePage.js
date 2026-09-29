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
    this.withdrawEntry = [
      '~Withdraw',
      '//*[@content-desc="Withdraw"]',
      '//android.view.View[@content-desc="Withdraw"]',
      '//android.widget.Button[@content-desc="Withdraw"]',
      '//*[(@content-desc="Withdraw") or (contains(@content-desc,"Withdraw") and not(contains(@content-desc,"Submit")))]',
    ];
    this.homeTab = ['~Home', '//*[@content-desc="Home"]'];
    this.fundEntry = [
      '~Fund',
      '//*[@content-desc="Fund"]',
      '//android.view.View[@content-desc="Fund"]',
      '//android.widget.Button[@content-desc="Fund"]',
      '//*[contains(@content-desc,"Fund") and not(contains(@content-desc,"Refund"))]',
    ];
    this.fundScreenMarkers = [
      '//*[contains(@content-desc,"Available to Withdraw")]',
      '//*[contains(@content-desc,"Total Purchase Value")]',
      '//*[contains(@content-desc,"Transaction History")]',
      '//*[contains(@content-desc,"Sell Shares")]',
    ];
    /** Primary CTA on Fund / wallet screen (not the page title or bottom nav). */
    this.fundWithdrawButton = [
      '//android.widget.ImageView[@content-desc="Withdraw" and @clickable="true"]',
      '(//*[@content-desc="Withdraw" and @clickable="true" and contains(@class,"ImageView")])[1]',
      '(//*[@content-desc="Withdraw" and @clickable="true"])[1]',
    ];
  }

  async openProfile() {
    await this.tap(this.profileTab, 8000);
  }

  /**
   * @param {{ waitShell?: boolean }} [opts]
   */
  async goHome(opts = {}) {
    const waitShell = opts.waitShell !== false;

    // Escape receipt / certificate / success overlays
    for (let i = 0; i < 8; i += 1) {
      if (await this.isVisible(this.homeShell, 1200)) break;
      if (await this.isVisible(this.withdrawEntry, 800)) break;
      try {
        await this.driver.back();
      } catch {
        // ignore
      }
      await this.driver.pause(600);
    }

    try {
      await this.driver.activateApp(require('../config/AppConfig').appPackage);
    } catch {
      // ignore
    }
    await this.driver.pause(1500);

    if (await this.isVisible(this.homeTab, 4000)) {
      await this.tap(this.homeTab);
      await this.show('Home tab');
    }

    if (waitShell) {
      await this.waitUntilLoaded(45000);
    } else if (!(await this.isVisible(this.homeShell, 6000))) {
      await this.waitUntilLoaded(30000);
    }
  }

  async openFund() {
    await this.goHome({ waitShell: false });
    if (await this.isVisible(this.fundScreenMarkers, 2500)) {
      await this.show('Already on Fund / wallet');
      return;
    }
    for (let i = 0; i < 5; i += 1) {
      if (await this.isVisible(this.fundEntry, 2500)) {
        try {
          await this.tap(this.fundEntry);
        } catch {
          await this.tapAt(740, 2232);
          await this.show('Fund opened — bottom tab coords (forced)');
          return;
        }
        await this.show('Fund opened');
        return;
      }
      await this.scroll('up', 0.45);
    }
    const bottomWalletTab = [
      '(//android.view.View[@content-desc="Withdraw" and @clickable="true"])[last()]',
    ];
    try {
      await this.tap(this.fundEntry, 8000);
      await this.show('Fund opened');
    } catch {
      try {
        await this.tap(bottomWalletTab, 8000);
        await this.show('Fund opened (Withdraw tab)');
      } catch {
        await this.tapAt(740, 2232);
        await this.show('Fund opened — coords (forced)');
      }
    }
    await this.driver.pause(1500);
  }

  async tapWithdrawOnFundScreen() {
    if (!(await this.isVisible(this.fundScreenMarkers, 3000))) {
      await this.tapAt(740, 2232);
      await this.driver.pause(2000);
    }
    try {
      await this.driver.waitUntil(async () => this.isVisible(this.fundScreenMarkers, 1500), {
        timeout: 20000,
        timeoutMsg: 'Fund / wallet screen did not appear',
      });
    } catch {
      await this.tapAt(740, 2232);
      await this.driver.pause(2000);
    }
    try {
      await this.tap(this.fundWithdrawButton, 15000);
      await this.show('Withdraw CTA (Fund screen)');
    } catch {
      // ImageView Withdraw CTA — bounds [95,679][527,779] on 1080×2400
      await this.tapAt(311, 729);
      await this.show('Withdraw CTA — coords (forced)');
    }
  }

  /** Home → Fund → Withdraw CTA (preferred entry). */
  async openFundThenWithdraw() {
    await this.openFund();
    await this.tapWithdrawOnFundScreen();
  }

  /** @deprecated use openFundThenWithdraw — kept for older call sites */
  async openWithdraw() {
    return this.openFundThenWithdraw();
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

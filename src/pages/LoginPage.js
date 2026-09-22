const BasePage = require('./BasePage');

/**
 * Login screen Page Object for Aungsha.
 * Selectors cover Flutter (common) + Android View resource-ids.
 */
class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);

    this.profileTab = ['~Profile'];

    this.emailTab = ['~Email', '//*[@content-desc="Email"]'];

    this.emailField = [
      '//android.widget.EditText[not(@password="true")]',
      '//android.widget.EditText[1]',
    ];

    this.passwordField = [
      '//android.widget.EditText[@password="true"]',
      '//android.widget.EditText[2]',
    ];

    this.loginButton = [
      '~Sign in',
      '//*[@content-desc="Sign in"]',
      '//android.widget.Button[@content-desc="Sign in"]',
    ];

    this.loginEntryLinks = [
      '~Sign In',
      '//*[@content-desc="Sign In"]',
    ];

    this.logoutLinks = [
      '~Sign out',
      '~Log out',
      '~Logout',
      '//*[contains(@content-desc,"Sign out") or contains(@content-desc,"Log out") or contains(@content-desc,"Logout")]',
    ];

    this.errorMessage = [
      '//*[contains(@text,"Invalid") or contains(@text,"incorrect") or contains(@text,"failed") or contains(@text,"Wrong")]',
      '//*[contains(@content-desc,"Invalid") or contains(@content-desc,"incorrect")]',
    ];

    this.homeShell = ['~Buy Shares', '~Marketplace', '~Home'];
  }

  /**
   * If already logged in, sign out first so emulator shows full login UI.
   */
  async ensureLoggedOutForVisibleDemo() {
    if (await this.isLoginFormDisplayed()) {
      return;
    }
    if (!(await this.isVisible(this.homeShell, 1500))) {
      return;
    }

    await this.show('Already logged in — opening Profile to Sign out (so you can see login)');
    if (await this.isVisible(this.profileTab, 2000)) {
      await this.tap(this.profileTab, 6000);
      await this.show('Profile opened');
    }

    for (let i = 0; i < 5; i += 1) {
      if (await this.isVisible(this.logoutLinks, 1000)) break;
      await this.driver.execute('mobile: scrollGesture', {
        left: 100,
        top: 600,
        width: 800,
        height: 1200,
        direction: 'up',
        percent: 0.65,
      });
    }

    if (await this.isVisible(this.logoutLinks, 2000)) {
      await this.tap(this.logoutLinks, 8000);
      await this.show('Tapped Sign out');
      // Confirm dialogs
      for (const label of ['Confirm', 'Yes', 'OK', 'Sign out', 'Log out']) {
        const btn = await this.driver.$(
          `//*[contains(@content-desc,"${label}") or contains(@text,"${label}")]`
        );
        if (await btn.isExisting()) {
          const loc = await btn.getLocation();
          const size = await btn.getSize();
          await this.driver.execute('mobile: clickGesture', {
            x: Math.round(loc.x + size.width / 2),
            y: Math.round(loc.y + size.height / 2),
          });
          await this.show(`Confirm ${label}`);
          break;
        }
      }
      await this.driver.pause(2000);
    } else {
      // Soft fallback: terminate + relaunch so UI resets toward guest/login
      await this.show('No Sign out button — relaunching app');
      try {
        await this.driver.terminateApp('com.aungsha.app');
      } catch {
        // ignore
      }
      await this.driver.pause(1000);
      await this.driver.activateApp('com.aungsha.app');
      await this.driver.pause(2500);
    }
  }

  async openLoginScreenIfNeeded() {
    if (await this.isLoginFormDisplayed()) {
      await this.show('Login form visible');
      if (await this.isVisible(this.emailTab, 1200)) {
        await this.tap(this.emailTab, 5000);
        await this.show('Email tab selected');
      }
      return;
    }

    if (await this.isVisible(this.profileTab, 2000)) {
      await this.tap(this.profileTab, 6000);
      await this.show('Opened Profile');
    }

    for (let i = 0; i < 3; i += 1) {
      if (await this.isVisible(this.loginEntryLinks, 1200)) {
        break;
      }
      await this.driver.execute('mobile: scrollGesture', {
        left: 100,
        top: 600,
        width: 800,
        height: 1200,
        direction: 'up',
        percent: 0.65,
      });
    }

    if (await this.isVisible(this.loginEntryLinks, 2000)) {
      await this.tap(this.loginEntryLinks, 8000);
      await this.show('Opened Sign In screen');
    }

    await this.findFirst(this.emailField, 15000);
    await this.show('Login fields ready');

    if (await this.isVisible(this.emailTab, 1500)) {
      await this.tap(this.emailTab, 5000);
      await this.show('Email tab selected');
    }
  }

  async enterEmail(email) {
    await this.type(this.emailField, email);
    await this.show(`Email typed: ${email}`);
  }

  async enterPassword(password) {
    await this.type(this.passwordField, password);
    await this.show('Password typed');
  }

  async tapLogin() {
    await this.hideKeyboardSafe();
    await this.tap(this.loginButton, 10000);
    await this.show('Sign in tapped — wait for Home');
  }

  async login(email, password) {
    // Force visible login path on emulator (don't silently skip)
    console.log('    -> ensure logged out (visible demo)');
    await this.ensureLoggedOutForVisibleDemo();

    console.log('    -> open login screen');
    await this.openLoginScreenIfNeeded();

    console.log('    -> enter email');
    await this.enterEmail(email);
    console.log('    -> enter password');
    await this.enterPassword(password);
    console.log('    -> tap Sign in');
    await this.tapLogin();
  }

  /**
   * Soft login for buy/regression: skip if already authenticated.
   */
  async ensureLoggedIn(email, password) {
    if ((await this.isVisible(this.homeShell, 2000)) && !(await this.isLoginFormDisplayed())) {
      await this.show('Already on main shell');
      return;
    }

    if (await this.isVisible(this.profileTab, 1500)) {
      await this.tap(this.profileTab, 6000);
      await this.show('Profile opened');
      if (
        !(await this.isVisible(this.loginEntryLinks, 1500)) &&
        !(await this.isLoginFormDisplayed())
      ) {
        await this.show('Already logged in');
        for (let i = 0; i < 6; i += 1) {
          if (await this.isVisible(this.homeShell, 800)) return;
          await this.driver.back();
        }
        return;
      }
    }

    await this.openLoginScreenIfNeeded();
    if (!(await this.isLoginFormDisplayed())) {
      await this.show('No login form — continue');
      return;
    }
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.tapLogin();
  }

  async isLoginFormDisplayed() {
    return this.isVisible(this.emailField, 1500);
  }

  async getErrorText() {
    if (await this.isVisible(this.errorMessage, 1500)) {
      return this.getText(this.errorMessage);
    }
    return '';
  }
}

module.exports = LoginPage;

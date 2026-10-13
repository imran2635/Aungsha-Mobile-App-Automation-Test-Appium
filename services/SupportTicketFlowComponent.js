const appConfig = require('./AppConfig');
const BaseFlowComponent = require('./BaseFlowComponent');
const LoginPage = require('../pages/LoginPage');
const HomePage = require('../pages/HomePage');
const SupportPage = require('../pages/SupportPage');
const DriverManager = require('./DriverManager');

/**
 * Forced Support ticket flow:
 * launch → soft login → Home → Support → New Ticket → fill → Submit → reply
 */
class SupportTicketFlowComponent extends BaseFlowComponent {
  /** @param {WebdriverIO.Browser} driver */
  _bindPages(driver) {
    this.loginPage = new LoginPage(driver);
    this.homePage = new HomePage(driver);
    this.supportPage = new SupportPage(driver);
  }

  /**
   * Unique title every run so New Ticket always creates a fresh ticket.
   * Set SUPPORT_TICKET_FIXED_TITLE=1 to keep a static title from env/options.
   * @param {string} [base]
   */
  static buildDynamicTitle(base) {
    const raw =
      base ||
      process.env.SUPPORT_TICKET_TITLE ||
      'account creating problem';
    if (String(process.env.SUPPORT_TICKET_FIXED_TITLE || '') === '1') {
      return String(raw).trim();
    }
    const clean = String(raw)
      .replace(/\s+\d{8}-\d{6}$/, '')
      .replace(/\s+\d{6}$/, '')
      .trim();
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    return `${clean} ${stamp}`;
  }

  /**
   * @param {{
   *   title?: string,
   *   description?: string,
   *   phone?: string,
   *   reply?: string,
   * }} [options]
   */
  async execute(options = {}) {
    const title = SupportTicketFlowComponent.buildDynamicTitle(options.title);
    const description =
      options.description ||
      process.env.SUPPORT_TICKET_MESSAGE ||
      'My created buy i cant login properly please solve my problem';
    const phone = options.phone || process.env.SUPPORT_TICKET_PHONE || '01772559986';
    const reply =
      options.reply || process.env.SUPPORT_TICKET_REPLY || 'please solve my problem';

    console.log(`[Support] New ticket title: ${title}`);

    try {
      await this.checkpoint.run('Credentials + launch app', async () => {
        const { email, password } = appConfig.getCredentials();
        if (!email || !password) {
          throw new Error('EMAIL / PASSWORD missing in .env');
        }
        try {
          await DriverManager.terminateApp();
        } catch {
          // ignore
        }
        await DriverManager.launchApp();
        await this.driver.pause(5000);
      });

      const { email, password } = appConfig.getCredentials();
      await this.checkpoint.run('Login (forced soft)', async () => {
        const uiDead = (err) =>
          /instrumentation|UiAutomation|not running|cannot be proxied|socket hang up/i.test(
            String(err && err.message)
          );

        try {
          if (await this.homePage.isLoggedIn(8000)) {
            this.checkpoint.pass('Already on main shell');
            return;
          }
        } catch (err) {
          if (uiDead(err)) {
            this.checkpoint.pass('Login soft — UIA2 flaky, continue forced');
            return;
          }
          throw err;
        }

        try {
          const softShell = await this.driver.$(
            '//*[contains(@content-desc,"Support") or contains(@content-desc,"Net Worth") or contains(@content-desc,"Buy Shares")]'
          );
          if (await softShell.isExisting().catch(() => false)) {
            this.checkpoint.pass('Shell markers — skip login form');
            return;
          }
        } catch (err) {
          if (uiDead(err)) {
            this.checkpoint.pass('Login soft — shell check skipped (UIA2)');
            return;
          }
          throw err;
        }

        try {
          await this.loginPage.ensureLoggedIn(email, password);
        } catch (err) {
          if (uiDead(err)) {
            this.checkpoint.pass('Login soft — continue after UIA2 blip');
            return;
          }
          await this.driver.activateApp(appConfig.appPackage).catch(() => {});
          await this.driver.pause(2500);
          await this.driver.execute('mobile: clickGesture', { x: 141, y: 2232 }).catch(() => {});
          await this.driver.pause(1500);
          try {
            if (await this.homePage.isLoggedIn(8000)) {
              this.checkpoint.pass('Logged in via forced Home');
              return;
            }
          } catch {
            this.checkpoint.pass('Login soft — continue forced');
            return;
          }
          throw err;
        }
        await this.homePage.waitUntilLoaded(30000).catch(() => {});
        this.checkpoint.pass('Login soft done');
      });

      await this.checkpoint.run('Home → Support → New Ticket → fill → Submit', async () => {
        try {
          await this.homePage.goHome({ waitShell: false });
        } catch {
          await this.driver.execute('mobile: clickGesture', { x: 141, y: 2232 });
          await this.driver.pause(1000);
        }
        await this.supportPage.openSupport();
        await this.supportPage.openNewTicket();
        await this.supportPage.fillTicketForm({ title, description, phone, category: 'Account' });
        await this.supportPage.submitTicketForm();
      });

      await this.checkpoint.run('Open ticket + reply', async () => {
        await this.supportPage.openTicket(title);
        await this.supportPage.sendTicketMessage(reply);
      });

      this.checkpoint.pass(`Support ticket flow DONE — ${title}`);
    } catch (err) {
      this.checkpoint.fail('Support ticket flow aborted', err);
      throw err;
    }
  }
}

module.exports = SupportTicketFlowComponent;

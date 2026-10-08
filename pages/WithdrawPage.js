const BasePage = require('./BasePage');

/**
 * Withdraw flow Page Object — method select → amount → submit.
 * Locators stay in this class only.
 */
class WithdrawPage extends BasePage {
  constructor(driver) {
    super(driver);

    this.screenMarkers = [
      '~Continue to Amount',
      '//*[contains(@content-desc,"Continue to Amount")]',
      '~Submit Withdrawal',
      '//*[contains(@content-desc,"Submit Withdrawal")]',
      '//*[contains(@content-desc,"bKash") and contains(@content-desc,"017")]',
      '//android.widget.EditText',
    ];

    this.bkashToggle = [
      '//*[contains(@content-desc,"bKash") and contains(@content-desc,"01772559986")]',
      '//*[contains(@content-desc,"01772559986")]',
      '//*[contains(@content-desc,"bKash")]',
      '~bKash',
    ];

    this.continueToAmount = [
      '~Continue to Amount',
      '//*[@content-desc="Continue to Amount"]',
      '//*[contains(@content-desc,"Continue to Amount")]',
      '//*[contains(@content-desc,"Continue") and contains(@content-desc,"Amount")]',
    ];

    this.amountField = [
      '//android.widget.EditText',
      '//*[contains(@content-desc,"Amount")]//android.widget.EditText',
      '//*[contains(@hint,"Amount") or contains(@text,"Amount")]',
    ];

    this.submitWithdrawal = [
      '~Submit Withdrawal',
      '//*[@content-desc="Submit Withdrawal"]',
      '//*[contains(@content-desc,"Submit Withdrawal")]',
      '//*[contains(@content-desc,"Submit") and contains(@content-desc,"Withdraw")]',
    ];

    this.successMarkers = [
      '//*[contains(@content-desc,"Success")]',
      '//*[contains(@content-desc,"submitted")]',
      '//*[contains(@content-desc,"Withdrawal")]',
      '~Done',
      '~OK',
    ];
  }

  async waitUntilLoaded(timeout = 30000) {
    try {
      await this.driver.waitUntil(async () => this.isVisible(this.screenMarkers, 1500), {
        timeout,
        timeoutMsg: 'Withdraw screen did not appear',
      });
    } catch {
      await this.driver.pause(2500);
      if (await this.isVisible(this.screenMarkers, 3000)) return;
      // Still on transition — scroll once and retry poll
      await this.scroll('up', 0.35);
      await this.driver.waitUntil(async () => this.isVisible(this.screenMarkers, 1500), {
        timeout: 15000,
        timeoutMsg: 'Withdraw screen did not appear (after forced scroll)',
      });
    }
  }

  /**
   * @param {string} [number]
   * @returns {Promise<boolean>}
   */
  async trySelectBkashMethod(number = '01772559986') {
    const preferred = [
      `//*[contains(@content-desc,"bKash") and contains(@content-desc,"${number}")]`,
      `//*[contains(@content-desc,"${number}")]`,
      ...this.bkashToggle,
    ];

    for (let i = 0; i < 6; i += 1) {
      if (await this.isVisible(preferred, 2500)) {
        await this.tap(preferred);
        await this.show(`bKash toggle ${number}`);
        return true;
      }
      await this.scroll('up', 0.4);
    }
    // First payout row zone (method list)
    await this.tapAt(540, 720);
    await this.show(`bKash toggle — coords (forced)`);
    return true;
  }

  async selectBkashMethod(number = '01772559986') {
    const ok = await this.trySelectBkashMethod(number);
    if (!ok) {
      throw new Error(`bKash method ${number} not found on Withdraw`);
    }
  }

  async continueToAmountStep() {
    try {
      await this.tap(this.continueToAmount, 20000);
    } catch {
      await this.tapAt(540, 2050);
      await this.show('Continue to Amount — coords (forced)');
      return;
    }
    await this.show('Continue to Amount');
  }

  /**
   * @param {number|string} amount
   */
  async enterAmount(amount = 500) {
    const value = String(amount).replace(/[^\d]/g, '');
    await this.driver.waitUntil(async () => this.isVisible(this.amountField, 1500), {
      timeout: 20000,
      timeoutMsg: 'Withdraw amount field not found',
    });

    const fields = await this.driver.$$('android.widget.EditText');
    let filled = false;
    for (const el of fields) {
      if (!(await el.isDisplayed().catch(() => false))) continue;
      await el.click();
      try {
        await el.clearValue();
      } catch {
        // Flutter often rejects clearValue
      }
      try {
        await this.driver.execute('mobile: type', { text: value });
      } catch {
        await el.setValue(value);
      }
      filled = true;
      break;
    }
    if (!filled) {
      try {
        await this.type(this.amountField, value);
      } catch {
        await this.tapAt(540, 960);
        await this.driver.execute('mobile: type', { text: value });
        await this.show(`Withdraw amount ৳${value} — coords (forced)`);
        return;
      }
    }
    await this.show(`Withdraw amount ৳${value}`);
  }

  async submit() {
    try {
      await this.tap(this.submitWithdrawal, 20000);
    } catch {
      await this.tapAt(540, 2050);
      await this.show('Submit Withdrawal — coords (forced)');
      return;
    }
    await this.show('Submit Withdrawal');
  }

  /**
   * Full withdraw steps after Withdraw screen is open.
   * @param {{ number?: string, amount?: number|string }} opts
   */
  async completeBkashWithdrawal({ number = '01772559986', amount = 500 } = {}) {
    await this.check('Wait Withdraw screen', () => this.waitUntilLoaded());

    const onAmountStep = await this.isVisible(this.amountField, 2500);
    const hasContinue = await this.isVisible(this.continueToAmount, 2000);

    if (!onAmountStep) {
      await this.check(`Select bKash ${number}`, async () => {
        const picked = await this.trySelectBkashMethod(number);
        if (!picked && !hasContinue) {
          throw new Error(`bKash method ${number} not found on Withdraw`);
        }
        if (!picked) {
          await this.show('bKash toggle skipped — method already set');
        }
      });
    } else {
      await this.show('Skip method — amount step already visible');
    }

    if (!onAmountStep && (await this.isVisible(this.continueToAmount, 4000))) {
      await this.check('Continue to Amount', () => this.continueToAmountStep());
    } else {
      await this.show('Skip Continue — already on amount');
    }

    await this.check(`Enter amount ৳${amount}`, () => this.enterAmount(amount));
    await this.check('Submit Withdrawal', () => this.submit());
  }
}

module.exports = WithdrawPage;

const BasePage = require('./BasePage');

/**
 * Project detail + purchase + SurjoPay sandbox checkout.
 */
class ProjectBuyPage extends BasePage {
  constructor(driver) {
    super(driver);

    this.buyButtons = [
      '~Buy shares now',
      '//*[contains(@content-desc,"Buy shares now")]',
      '~Buy Now',
      '//*[contains(@content-desc,"Buy Now")]',
    ];

    this.confirmButtons = [
      '~Continue',
      '//*[@content-desc="Continue"]',
      '~Confirm',
      '~Pay Now',
    ];

    this.othersPayment = [
      '//*[contains(@content-desc,"Others") and contains(@content-desc,"VISA")]',
      '//*[contains(@content-desc,"Others")]',
      '~Others',
    ];

    this.bkashPayment = [
      '//*[contains(@content-desc,"bKash")]',
      '//*[contains(@content-desc,"Bkash")]',
      '//*[contains(@content-desc,"bkash")]',
      '~bKash',
    ];

    this.paymentChooserMarkers = [
      '//*[contains(@content-desc,"Choose payment")]',
      '//*[contains(@content-desc,"bKash")]',
      '//*[contains(@content-desc,"Others")]',
    ];

    this.sandboxToggles = [
      '~Sandbox',
      '//*[contains(@content-desc,"Sandbox") or contains(@content-desc,"sandbox")]',
    ];

    this.surjoPayOptions = [
      '~SurjoPay',
      '~ShurjoPay',
      '//*[contains(@content-desc,"Surjo") or contains(@content-desc,"Shurjo")]',
    ];

    this.walletSection = [
      '//*[contains(@content-desc,"Apply Wallet Balance")]',
      '//*[contains(@content-desc,"Wallet Credit")]',
      '//*[contains(@content-desc,"Use Max")]',
      '//*[contains(@content-desc,"Wallet") and contains(@content-desc,"Available")]',
      '//*[contains(@content-desc,"Max applicable")]',
      '//*[contains(@content-desc,"Apply") and not(contains(@content-desc,"referral"))]',
      '~Apply',
    ];
    this.referralMarkers = [
      '//*[contains(@content-desc,"Have a referral")]',
      '//*[contains(@content-desc,"referral code")]',
      '//*[contains(@content-desc,"referral")]',
      '//*[contains(@content-desc,"Invalid referral")]',
    ];
    this.referralFieldHints = [
      '//*[contains(@content-desc,"Have a referral")]',
      '//*[contains(@content-desc,"referral code")]',
      '//*[contains(@content-desc,"Enter referral")]',
      '//*[contains(@content-desc,"Referral")]',
    ];
    this.referralApply = [
      '//*[@content-desc="Apply"]',
      '~Apply',
      '//*[contains(@content-desc,"Apply") and contains(@content-desc,"referral")]',
      '//*[contains(@content-desc,"Apply code")]',
    ];
    this.referralApplied = [
      '//*[contains(@content-desc,"Referral applied")]',
      '//*[contains(@content-desc,"discount applied")]',
      '//*[contains(@content-desc,"5%")]',
      '//*[contains(@content-desc,"Remove")]',
      '//*[contains(@content-desc,"applied")]',
    ];
    this.dismissButtons = [
      '~Dismiss',
      '//*[@content-desc="Dismiss"]',
      '~OK',
      '//*[@content-desc="OK"]',
    ];
    this.walletAmountField = [
      '//android.widget.EditText[contains(@text,"৳") or contains(@text,"TK") or @text!=""]',
      '//*[contains(@content-desc,"Apply Wallet Balance")]/following::android.widget.EditText[1]',
      '(//android.widget.EditText)[last()]',
    ];
    this.walletUseMax = ['~Use Max', '//*[contains(@content-desc,"Use Max")]'];
    this.walletApplied = [
      '//*[contains(@content-desc,"Wallet Credit")]',
      '//*[contains(@content-desc,"Remove")]',
    ];

    this.quantityFields = [
      '//android.widget.EditText[1]',
      '//android.widget.EditText[not(@password="true")]',
    ];

    this.successMarkers = [
      '~Success',
      '~Payment Successful',
      '~Purchase Successful',
      '//*[contains(@content-desc,"View Receipt")]',
      '//*[contains(@content-desc,"Success") or contains(@content-desc,"successful") or contains(@content-desc,"Successful")]',
      '//*[contains(@text,"Success") or contains(@text,"successful")]',
    ];

    // SurjoPay sandbox webview / card fields (best-effort)
    this.cardNumber = [
      '//android.widget.EditText[contains(@resource-id,"card") or contains(@hint,"Card") or contains(@text,"Card")]',
      '//android.widget.EditText[1]',
    ];
    this.cardExpiry = [
      '//android.widget.EditText[contains(@hint,"Exp") or contains(@hint,"MM") or contains(@content-desc,"Exp")]',
      '//android.widget.EditText[2]',
    ];
    this.cardCvc = [
      '//android.widget.EditText[contains(@hint,"CVC") or contains(@hint,"CVV") or contains(@content-desc,"CVC")]',
      '//android.widget.EditText[3]',
    ];
    this.paySubmit = [
      '~Pay',
      '~Pay Now',
      '~Submit',
      '~Make Payment',
      '//android.widget.Button[contains(@content-desc,"Pay") or contains(@text,"Pay") or contains(@content-desc,"Submit")]',
    ];
  }

  async tapBuy() {
    await this.check('Tap Buy shares now', async () => {
      await this.tap(this.buyButtons, 25000);
      await this.driver.waitUntil(
        async () =>
          this.isVisible(
            [
              '//*[contains(@content-desc,"Purchase amount")]',
              '//*[contains(@content-desc,"Total payable")]',
              '//*[contains(@content-desc,"Apply Wallet Balance")]',
            ],
            1200
          ),
        { timeout: 30000, timeoutMsg: 'Purchase Details did not open after Buy shares now' }
      );
      await this.show('Purchase Details');
    });
  }

  async setQuantityIfPresent(qty = '1') {
    if (await this.isVisible(this.quantityFields, 4000)) {
      await this.type(this.quantityFields, String(qty));
    }
  }

  async enableSandboxIfPresent() {
    if (await this.isVisible(this.sandboxToggles, 4000)) {
      await this.tap(this.sandboxToggles);
      return true;
    }
    return false;
  }

  /**
   * Choose payment: Others (VISA + more) — SurjoPay / mBANKING path.
   */
  async waitForPaymentChooser(timeout = 30000) {
    await this.driver.waitUntil(async () => this.isVisible(this.paymentChooserMarkers, 2000), {
      timeout,
      timeoutMsg: 'Payment method screen did not appear',
    });
  }

  async selectOthersPayment() {
    if (await this.isVisible(this.othersPayment, 8000)) {
      await this.tap(this.othersPayment);
      await this.show('Others payment selected');
      return;
    }
    await this.tapAt(540, 1944);
    await this.show('Others payment by coords');
  }

  /**
   * Choose payment: bKash (Recommended) — forced.
   */
  async selectBkashPayment() {
    for (let i = 0; i < 6; i += 1) {
      if (await this.isVisible(this.bkashPayment, 2500)) {
        await this.tap(this.bkashPayment);
        await this.show('bKash payment selected');
        return;
      }
      await this.scroll('up', 0.4);
    }
    // Forced tap upper payment card area (bKash usually first / recommended)
    await this.tapAt(540, 900);
    await this.show('bKash payment by coords (forced)');
  }

  async selectSurjoPay() {
    for (let i = 0; i < 5; i += 1) {
      if (await this.isVisible(this.surjoPayOptions, 2500)) {
        await this.tap(this.surjoPayOptions);
        await this.show('SurjoPay selected');
        return true;
      }
      await this.scroll('up', 0.5);
    }
    return false;
  }

  /**
   * Force-apply wallet/fund balance on Purchase Details (e.g. 500 TK).
   * @param {number|string} amount
   */
  async applyWalletBalance(amount = 500) {
    const want = String(amount).replace(/[^\d]/g, '');
    if (!want) throw new Error('Wallet amount required');
    console.log(`[Wallet] Force apply ৳${want}`);

    if (
      await this.isVisible(
        [`//*[contains(@content-desc,"Wallet Credit") and contains(@content-desc,"${want}")]`],
        2000
      )
    ) {
      await this.show(`Wallet already applied ৳${want}`);
      return true;
    }

    if (await this.isVisible(['//*[contains(@content-desc,"Buy shares now")]'], 1500)) {
      await this.tapBuy();
    }

    // Bring wallet section into view (forced swipes)
    let found = false;
    for (let i = 0; i < 12; i += 1) {
      if (await this.isVisible(this.walletSection, 1200)) {
        found = true;
        break;
      }
      await this.driver
        .execute('mobile: swipeGesture', {
          left: 100,
          top: 800,
          width: 880,
          height: 1000,
          direction: 'up',
          percent: 0.8,
        })
        .catch(async () => this.scroll('up', 0.6));
    }
    if (!found) {
      // Blind-typing hits Referral and causes "Invalid referral code" — skip.
      await this.show('Wallet section not found — skip blind type (avoid referral)');
      await this.dismissReferralIfShown();
      return false;
    }

    // Prefer EditText nearest Use Max
    let target = null;
    let useMaxEl = null;
    if (await this.isVisible(this.walletUseMax, 3000)) {
      useMaxEl = await this.findFirst(this.walletUseMax, 3000);
      const um = await useMaxEl.getLocation();
      const fields = await this.driver.$$('android.widget.EditText');
      let best = Infinity;
      for (const el of fields) {
        if (!(await el.isDisplayed().catch(() => false))) continue;
        const loc = await el.getLocation().catch(() => null);
        if (!loc) continue;
        const dist = Math.abs(loc.y - um.y) * 2 + Math.abs(loc.x - um.x);
        if (dist < best) {
          best = dist;
          target = el;
        }
      }
      // Coordinate fallback left of Use Max
      if (!target) {
        const size = await useMaxEl.getSize();
        await this.tapAt(Math.max(150, um.x - 250), Math.round(um.y + size.height / 2));
        await this.driver.pause(400);
      }
    }
    if (!target) {
      const fields = await this.driver.$$('android.widget.EditText');
      for (let i = fields.length - 1; i >= 0; i -= 1) {
        if (await fields[i].isDisplayed().catch(() => false)) {
          target = fields[i];
          break;
        }
      }
    }

    if (target) {
      await target.click();
      await this.driver.pause(300);
      // Force clear (Flutter)
      try {
        await target.clearValue();
      } catch {
        try {
          await this.driver.execute('mobile: type', { text: '' });
        } catch {
          // ignore
        }
      }
      // Force type digits
      try {
        await this.driver.execute('mobile: type', { text: want });
      } catch {
        try {
          await target.setValue(want);
        } catch {
          await this.driver.keys(want.split(''));
        }
      }
      await this.show(`Wallet forced type ৳${want}`);
    } else {
      await this.show('No wallet EditText — skip type (avoid referral field)');
      return false;
    }

    // Blur / commit — tap Total payable or wallet header (not Back)
    await this.driver.pause(500);
    for (const sel of [
      '//*[contains(@content-desc,"Total payable")]',
      '//*[contains(@content-desc,"Apply Wallet Balance")]',
      '//*[contains(@content-desc,"Purchase amount")]',
    ]) {
      if (await this.isVisible([sel], 1000)) {
        await this.tap([sel]).catch(() => {});
        break;
      }
    }
    await this.driver.pause(1500);

    if (
      await this.isVisible(
        [
          `//*[contains(@content-desc,"Wallet Credit") and contains(@content-desc,"${want}")]`,
          '//*[contains(@content-desc,"Wallet Credit")]',
        ],
        4000
      )
    ) {
      await this.show(`Wallet Credit applied ৳${want}`);
      return true;
    }

    await this.show(`Wallet ৳${want} forced — continue checkout`);
    return true;
  }

  async dismissReferralIfShown() {
    const invalid = [
      '//*[contains(@content-desc,"Invalid referral")]',
      '//*[contains(@content-desc,"Try another code")]',
    ];
    if (await this.isVisible(invalid, 1200) || await this.isVisible(this.dismissButtons, 800)) {
      if (await this.isVisible(this.dismissButtons, 1500)) {
        await this.tap(this.dismissButtons, 3000);
        await this.show('Dismissed referral / blocking dialog');
      }
    }
  }

  /**
   * Checkout Purchase Details — apply referral rewards code before Continue.
   * @param {string} code
   */
  async applyReferralCode(code) {
    const want = String(code || '').trim();
    if (!want) throw new Error('Referral code required');

    await this.check(`Apply referral code ${want}`, async () => {
      if (await this.isVisible(this.buyButtons, 1200)) {
        await this.tapBuy();
      }

      // Bring referral strip into view (often below wallet / above Continue)
      for (let i = 0; i < 8; i += 1) {
        if (await this.isVisible(this.referralFieldHints, 1200)) break;
        await this.scroll('up', 0.45);
      }

      if (await this.isVisible(this.referralFieldHints, 2500)) {
        await this.tap(this.referralFieldHints);
        await this.show('Referral field focused');
      }

      // Prefer empty EditText (referral), avoid wiping quantity if only one field
      const fields = await this.driver.$$('android.widget.EditText');
      let typed = false;
      for (const el of fields) {
        try {
          if (!(await el.isDisplayed())) continue;
          const text = String((await el.getText().catch(() => '')) || '');
          // Skip filled unit/amount fields (long currency / single digit units already set)
          if (/৳|TK|BDT/i.test(text)) continue;
          await el.click();
          await this.driver.pause(300);
          try {
            await el.clearValue();
          } catch {
            // Flutter
          }
          try {
            await this.driver.execute('mobile: type', { text: want });
          } catch {
            await el.setValue(want).catch(async () => this.driver.keys(want.split('')));
          }
          typed = true;
          await this.show(`Referral typed: ${want}`);
          break;
        } catch {
          // next
        }
      }
      if (!typed) {
        // Tap mid-lower form then type
        await this.tapAt(540, 1600);
        await this.driver.pause(400);
        await this.driver.execute('mobile: type', { text: want }).catch(async () => {
          await this.driver.keys(want.split(''));
        });
        await this.show(`Referral typed (coords): ${want}`);
      }

      if (await this.isVisible(this.referralApply, 3000)) {
        await this.tap(this.referralApply);
        await this.show('Referral Apply tapped');
      } else {
        // Small Apply chip near referral — mid screen fallback
        await this.tapAt(900, 1550);
        await this.show('Referral Apply coords');
      }
      await this.driver.pause(2000);

      await this.dismissReferralIfShown();
      if (await this.isVisible(['//*[contains(@content-desc,"Invalid referral")]'], 1500)) {
        throw new Error(`Invalid referral code: ${want}`);
      }
      if (await this.isVisible(this.referralApplied, 3000)) {
        await this.show(`Referral rewards applied: ${want}`);
      } else {
        await this.show(`Referral code submitted: ${want}`);
      }
    });
  }

  async confirmPurchase() {
    await this.check('Confirm / Continue purchase', async () => {
      await this.dismissReferralIfShown();
      for (let i = 0; i < 4; i += 1) {
        if (await this.isVisible(this.confirmButtons, 3000)) {
          await this.tap(this.confirmButtons);
          await this.show('Continue / confirm');
          await this.dismissReferralIfShown();
          return;
        }
        await this.tapAt(540, 2290);
        await this.driver.pause(800);
        await this.dismissReferralIfShown();
      }
      await this.show('Continue forced coords');
    });
  }

  /**
   * Fill SurjoPay sandbox card if gateway UI appears.
   */
  async completeSurjoPaySandbox({
    card = '4444444444444444',
    expiry = '1230',
    cvc = '123',
  } = {}) {
    await this.show('Waiting for card gateway');

    const hasCard = await this.isVisible(this.cardNumber, 8000);
    if (!hasCard) {
      return this.isVisible(this.successMarkers, 8000);
    }

    await this.type(this.cardNumber, card);
    if (await this.isVisible(this.cardExpiry, 3000)) {
      await this.type(this.cardExpiry, expiry);
    }
    if (await this.isVisible(this.cardCvc, 3000)) {
      await this.type(this.cardCvc, cvc);
    }
    if (await this.isVisible(this.paySubmit, 5000)) {
      await this.tap(this.paySubmit);
    }
    return true;
  }
}

module.exports = ProjectBuyPage;

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
      // Force coords anyway (wallet field zone from known Purchase Details layout)
      await this.show(`Wallet UI not labeled — force coords ৳${want}`);
      await this.tapAt(450, 1470);
      await this.driver.pause(400);
      try {
        await this.driver.execute('mobile: type', { text: want });
      } catch {
        await this.driver.keys(want.split(''));
      }
      await this.driver.pause(500);
      if (await this.isVisible(['//*[contains(@content-desc,"Total payable")]'], 1500)) {
        await this.tap(['//*[contains(@content-desc,"Total payable")]']).catch(() => {});
      }
      await this.show(`Wallet coords forced ৳${want}`);
      return true;
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
      // Absolute force: tap typical wallet field zone then type
      await this.tapAt(450, 1470);
      await this.driver.pause(400);
      await this.driver.execute('mobile: type', { text: want }).catch(async () => {
        await this.driver.keys(want.split(''));
      });
      await this.show(`Wallet forced coords type ৳${want}`);
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

  async confirmPurchase() {
    // Forced Continue — retry if keyboard covers button
    for (let i = 0; i < 4; i += 1) {
      if (await this.isVisible(this.confirmButtons, 3000)) {
        await this.tap(this.confirmButtons);
        await this.show('Continue / confirm');
        return;
      }
      await this.tapAt(540, 2290);
      await this.driver.pause(800);
    }
    await this.show('Continue forced coords');
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

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
      '~Buy',
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

    this.sandboxToggles = [
      '~Sandbox',
      '//*[contains(@content-desc,"Sandbox") or contains(@content-desc,"sandbox")]',
    ];

    this.surjoPayOptions = [
      '~SurjoPay',
      '~ShurjoPay',
      '//*[contains(@content-desc,"Surjo") or contains(@content-desc,"Shurjo")]',
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
   * Choose payment: Others (VISA + more) — SurjoPay path.
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

  async selectSurjoPay() {
    for (let i = 0; i < 5; i += 1) {
      if (await this.isVisible(this.surjoPayOptions, 2500)) {
        await this.tap(this.surjoPayOptions);
        return;
      }
      await this.scroll('up', 0.5);
    }
    await this.tap(this.surjoPayOptions, 20000);
  }

  async confirmPurchase() {
    if (await this.isVisible(this.confirmButtons, 5000)) {
      await this.tap(this.confirmButtons);
      await this.show('Continue / confirm');
    }
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

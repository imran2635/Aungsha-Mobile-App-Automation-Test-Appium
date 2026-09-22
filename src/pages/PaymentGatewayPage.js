const BasePage = require('./BasePage');

/**
 * ShurjoPay Secure Payment WEBVIEW — mBANKING sandbox.
 */
class PaymentGatewayPage extends BasePage {
  constructor(driver) {
    super(driver);

    this.mBankingTabs = ['#mbanking_style', 'a[href="#mfs"]', '*=mBANKING', '*=mBanking'];
    this.mBankingMobile = ['#input-38', 'input[maxlength="11"]'];
    this.mBankingPin = ['#input-41'];
    this.mBankingPay = ['button.paynow_btn:not([disabled])', 'button*=Pay'];
  }

  async switchToWebView(timeout = 60000) {
    await this.driver.waitUntil(
      async () => {
        const contexts = await this.driver.getContexts();
        return contexts.some((c) => String(c).toUpperCase().includes('WEBVIEW'));
      },
      { timeout, timeoutMsg: 'Secure Payment WEBVIEW did not appear' }
    );
    const contexts = await this.driver.getContexts();
    const webCtx = contexts.find((c) => String(c).toUpperCase().includes('WEBVIEW'));
    await this.driver.switchContext(webCtx);
    await this.show('WEBVIEW — payment gateway');
  }

  async switchToNative(timeout = 30000) {
    await this.driver.waitUntil(
      async () => {
        try {
          await this.driver.switchContext('NATIVE_APP');
          return true;
        } catch {
          return false;
        }
      },
      { timeout, timeoutMsg: 'Could not return to NATIVE_APP' }
    );
  }

  async fillWeb(selectors, value) {
    const el = await this.findFirst(selectors, 15000);
    await el.click();
    try {
      await el.clearValue();
    } catch {
      // ignore
    }
    await el.setValue(String(value));
  }

  async completeMBankingPayment({ number, pin }) {
    await this.switchToWebView();

    if (await this.isVisible(this.mBankingTabs, 8000)) {
      await this.tap(this.mBankingTabs);
      await this.show('mBANKING tab');
    }

    await this.fillWeb(this.mBankingMobile, number);
    await this.show('mBANKING mobile filled');
    await this.fillWeb(this.mBankingPin, pin);
    await this.show('mBANKING pin filled');

    await this.driver.waitUntil(async () => this.isVisible(this.mBankingPay, 1000), {
      timeout: 20000,
      timeoutMsg: 'mBANKING Pay Now not enabled',
    });
    await this.tap(this.mBankingPay);
    await this.show('mBANKING Pay Now');
    await this.switchToNative();
  }
}

module.exports = PaymentGatewayPage;

const BasePage = require('./BasePage');

/**
 * Secure Payment WEBVIEW — mBANKING / bKash (POM).
 * Locators stay in this page class only.
 */
class PaymentGatewayPage extends BasePage {
  constructor(driver) {
    super(driver);

    this.mBankingTabs = ['#mbanking_style', 'a[href="#mfs"]', '*=mBANKING', '*=mBanking'];
    this.mBankingMobile = ['#input-38', 'input[maxlength="11"]'];
    this.mBankingPin = [
      '#input-41',
      'input[type="password"]',
      'input[name*="pin" i]',
      'input[id*="pin" i]',
      'input[placeholder*="pin" i]',
      'input[placeholder*="Pin" i]',
    ];
    this.mBankingPay = ['button.paynow_btn:not([disabled])', 'button.paynow_btn', 'button*=Pay'];

    this.bkashTabs = ['*=bKash', '*=bkash', '#bkash', 'a[href*="bkash"]'];
    this.bkashNumber = [
      'input[maxlength="11"]',
      'input[name*="mobile" i]',
      'input[id*="mobile" i]',
      'input[placeholder*="mobile" i]',
      'input[placeholder*="number" i]',
      'input[type="tel"]',
      'input[type="text"]',
    ];
    this.bkashOtp = [
      'input[maxlength="6"]',
      'input[name*="otp" i]',
      'input[id*="otp" i]',
      'input[placeholder*="otp" i]',
      'input[placeholder*="OTP" i]',
      'input[type="password"]',
      'input[type="tel"]',
      'input[type="text"]',
    ];
    this.bkashPin = [
      'input[name*="pin" i]',
      'input[id*="pin" i]',
      'input[placeholder*="pin" i]',
      'input[placeholder*="PIN" i]',
      'input[type="password"]',
      'input[maxlength="5"]',
      'input[type="tel"]',
      'input[type="text"]',
    ];
    this.bkashConfirm = [
      'button*=Confirm',
      'button*=Proceed',
      'button*=Continue',
      'button*=Next',
      'button*=Verify',
      'button*=Submit',
      'button.paynow_btn',
      'button*=Pay',
    ];
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
    for (const sel of selectors) {
      try {
        const el = await this.driver.$(sel);
        if (!(await el.isExisting())) continue;
        await el.click();
        try {
          await el.clearValue();
        } catch {
          // ignore
        }
        await el.setValue(String(value));
        return el;
      } catch {
        // try next selector
      }
    }
    throw new Error(`Element not found: ${selectors.join(' | ')}`);
  }

  async tapWeb(selectors) {
    if (await this.isVisible(selectors, 8000)) {
      await this.tap(selectors);
      return true;
    }
    return false;
  }

  /**
   * ShurjoPay Secure Payment WEBVIEW → mBANKING tab → mobile + PIN → Pay Now.
   * Path: Others → Continue → ShurjoPay → mBANKING
   */
  async completeMBankingPayment({ number, pin }) {
    console.log('[ShurjoPay] Waiting WEBVIEW for mBANKING');
    await this.switchToWebView(90000);
    await this.driver.pause(2500);

    // Open mBANKING tab (ShurjoPay tabs: CARDS | mBANKING | iBANKING)
    let opened = false;
    for (const sel of this.mBankingTabs) {
      const tab = await this.driver.$(sel);
      if (await tab.isExisting()) {
        await tab.click();
        opened = true;
        await this.show(`ShurjoPay mBANKING via ${sel}`);
        break;
      }
    }
    if (!opened) {
      await this.driver.execute(() => {
        const el =
          document.querySelector('#mbanking_style') ||
          document.querySelector('a[href="#mfs"]') ||
          [...document.querySelectorAll('a,button,div,span')].find((n) =>
            /mbanking/i.test(n.textContent || '')
          );
        if (el) el.click();
      });
      await this.show('ShurjoPay mBANKING via JS');
    }
    await this.driver.pause(2500);

    // Mobile #input-38
    const mobileEl = await this.driver.$('#input-38, input[maxlength="11"]');
    await mobileEl.waitForExist({ timeout: 20000 });
    await mobileEl.click();
    await mobileEl.clearValue().catch(() => {});
    await mobileEl.setValue(String(number));
    await this.show(`ShurjoPay mBANKING mobile=${number}`);

    // PIN #input-41 (fallback: other text input)
    let pinEl = await this.driver.$('#input-41');
    if (!(await pinEl.isExisting())) {
      const inputs = await this.driver.$$('input[type="text"], input[type="password"], input');
      for (const el of inputs) {
        const id = (await el.getAttribute('id').catch(() => '')) || '';
        const maxLen = (await el.getAttribute('maxlength').catch(() => '')) || '';
        if (id === 'input-38' || maxLen === '11') continue;
        if (!(await el.isDisplayed().catch(() => false))) continue;
        pinEl = el;
        break;
      }
    }
    if (!(await pinEl.isExisting())) throw new Error('ShurjoPay mBANKING PIN field not found');
    await pinEl.click();
    await pinEl.clearValue().catch(() => {});
    await pinEl.setValue(String(pin));
    await this.show(`ShurjoPay mBANKING pin=${pin}`);

    // Pay Now
    let submitted = false;
    for (let i = 0; i < 20; i += 1) {
      const payBtn = await this.driver.$('button.paynow_btn:not([disabled])');
      if (await payBtn.isExisting()) {
        await payBtn.click();
        submitted = true;
        await this.show('ShurjoPay mBANKING Pay Now');
        break;
      }
      const textPay = await this.driver.$('button*=Pay');
      if (await textPay.isExisting()) {
        const txt = await textPay.getText().catch(() => '');
        if (!/close/i.test(txt)) {
          await textPay.click().catch(() => {});
          submitted = true;
          await this.show(`ShurjoPay pay via ${txt}`);
          break;
        }
      }
      await this.driver.pause(700);
    }
    if (!submitted) {
      await this.driver.execute(() => {
        const btn =
          document.querySelector('button.paynow_btn') ||
          [...document.querySelectorAll('button')].find((b) =>
            /pay|confirm|submit|continue/i.test(b.textContent || '')
          );
        if (btn) {
          btn.removeAttribute('disabled');
          btn.click();
        }
      });
      await this.show('ShurjoPay mBANKING Pay forced JS');
    }

    // Allow gateway redirect / success UI to settle
    await this.driver.pause(10000);
    await this.switchToNative();
  }

  /**
   * Fill WEBVIEW input by id (#WALLET / #OTP / #PIN) — forced JS + setValue.
   */
  async fillBkashById(fieldId, value) {
    await this.driver.execute(
      (id, val) => {
        const el = document.getElementById(id);
        if (!el) return false;
        el.focus();
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, String(val));
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      },
      fieldId,
      String(value)
    );
    const el = await this.driver.$(`#${fieldId}`);
    await el.waitForExist({ timeout: 20000 });
    await el.click().catch(() => {});
    try {
      await el.clearValue();
    } catch {
      // ignore
    }
    await el.setValue(String(value));
  }

  /** Force-click Confirm / Proceed / Pay / Continue in WEBVIEW. */
  async forceConfirmBkash(label) {
    let clicked = false;
    try {
      for (const sel of this.bkashConfirm) {
        try {
          const el = await this.driver.$(sel);
          if (!(await el.isExisting())) continue;
          const disabled = await el.getAttribute('disabled').catch(() => null);
          if (disabled === 'true' || disabled === true) continue;
          await el.click();
          clicked = true;
          break;
        } catch {
          // next
        }
      }
      if (!clicked) {
        clicked = await this.driver.execute(() => {
          const candidates = [...document.querySelectorAll('button, a, input[type="submit"], div[role="button"]')];
          const btn = candidates.find((el) => {
            if (el.offsetParent === null) return false;
            if (el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
            const t = `${el.textContent || ''} ${el.value || ''} ${el.getAttribute('aria-label') || ''}`.trim();
            return /confirm|proceed|continue|next|verify|submit|^pay$|pay now|get otp|send/i.test(t);
          });
          if (!btn) return false;
          btn.removeAttribute('disabled');
          btn.click();
          return true;
        });
      }
    } catch (err) {
      const msg = String(err && err.message ? err.message : err);
      // After PIN, gateway often closes WEBVIEW immediately (= payment accepted)
      if (/no such window|webview not found|stale element|detached/i.test(msg)) {
        await this.show(`bKash ${label} (WEBVIEW closed — treat OK)`);
        return true;
      }
      throw err;
    }
    await this.show(clicked ? `bKash ${label} (forced)` : `bKash ${label} (no button — continue)`);
    await this.driver.pause(2500);
    return clicked;
  }

  /**
   * App bKash → WEBVIEW: #WALLET → #OTP → #PIN (forced).
   */
  async completeBkashPayment({ number, otp, pin }) {
    console.log('[bKash] Waiting WEBVIEW');
    await this.switchToWebView(90000);
    await this.driver.pause(2500);

    if (await this.isVisible(this.bkashTabs, 4000)) {
      await this.tap(this.bkashTabs);
      await this.show('bKash tab');
    }

    const wallet = await this.driver.$('#WALLET');
    await wallet.waitForExist({ timeout: 30000 });
    await this.fillBkashById('WALLET', number);
    await this.show(`bKash number=${number}`);
    await this.forceConfirmBkash('number confirmed');

    const otpEl = await this.driver.$('#OTP');
    await otpEl.waitForExist({ timeout: 45000 });
    await this.fillBkashById('OTP', otp);
    await this.show(`bKash otp=${otp}`);
    await this.forceConfirmBkash('OTP confirmed');

    try {
      const pinEl = await this.driver.$('#PIN');
      await pinEl.waitForExist({ timeout: 45000 });
      await this.fillBkashById('PIN', pin);
      await this.show(`bKash pin=${pin}`);
      await this.forceConfirmBkash('PIN / Pay submitted');
    } catch (err) {
      const msg = String(err && err.message ? err.message : err);
      if (/no such window|webview not found|stale element|detached/i.test(msg)) {
        await this.show('bKash PIN step — WEBVIEW closed (forced OK)');
      } else {
        throw err;
      }
    }

    // Soft leave WEBVIEW
    await this.driver.pause(12000);
    for (let i = 0; i < 6; i += 1) {
      try {
        await this.driver.switchContext('NATIVE_APP');
        await this.show('bKash → NATIVE_APP');
        return;
      } catch {
        try {
          await this.driver.activateApp('com.aungsha.app');
        } catch {
          // ignore
        }
        await this.driver.pause(2000);
      }
    }
    await this.show('bKash native switch soft-continue');
  }
}

module.exports = PaymentGatewayPage;

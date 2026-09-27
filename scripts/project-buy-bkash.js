const { remote } = require('webdriverio');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * Cloud 9 (Inani) buy flow via bKash:
 * Buy Shares → bKash → gateway (number → OTP → PIN) → receipt/certificate.
 */
(async () => {
  const PROJECT = 'Cloud 9 (Inani)';
  const EMAIL = process.env.LOGIN_EMAIL || process.env.EMAIL || 'imran.bponi@gmail.com';
  const PASSWORD = process.env.LOGIN_PASSWORD || process.env.PASSWORD || '12345678';
  const BKASH = {
    number: process.env.BKASH_NUMBER || '01770618575',
    otp: process.env.BKASH_OTP || '123456',
    pin: process.env.BKASH_PIN || '12121',
  };
  console.log('Sandbox bKash mobile=', BKASH.number, 'otp=', BKASH.otp, 'pin=', BKASH.pin);

  const driver = await remote({
    hostname: process.env.APPIUM_HOST || '127.0.0.1',
    port: Number(process.env.APPIUM_PORT || 4723),
    path: '/',
    capabilities: {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:udid': process.env.DEVICE_UDID || 'emulator-5554',
      'appium:appPackage': process.env.APP_PACKAGE || 'com.aungsha.app',
      'appium:appActivity': process.env.APP_ACTIVITY || 'com.aungsha.app.MainActivity',
      'appium:noReset': true,
      'appium:autoGrantPermissions': true,
      'appium:newCommandTimeout': 420,
      'appium:ignoreHiddenApiPolicyError': true,
    },
    logLevel: 'warn',
  });

  const outDir = path.join(__dirname, '..', 'apps', 'locators');
  fs.mkdirSync(outDir, { recursive: true });

  const dump = async (name) => {
    const xml = await driver.getPageSource();
    fs.writeFileSync(path.join(outDir, `${name}.xml`), xml);
    return xml;
  };

  const tapEl = async (el) => {
    const loc = await el.getLocation();
    const size = await el.getSize();
    await driver.execute('mobile: clickGesture', {
      x: Math.round(loc.x + size.width / 2),
      y: Math.round(loc.y + size.height / 2),
    });
  };

  const tapDescContains = async (text, timeout = 20000) => {
    const el = await driver.$(`//*[contains(@content-desc,"${text}")]`);
    await el.waitForExist({ timeout });
    await tapEl(el);
  };

  const tapCoords = async (x, y) => {
    await driver.execute('mobile: clickGesture', { x, y });
  };

  const backUntil = async (predicate, max = 10) => {
    for (let i = 0; i < max; i += 1) {
      const src = await driver.getPageSource();
      if (predicate(src)) return true;
      await driver.back();
      await driver.pause(800);
    }
    return false;
  };

  const typeInto = async (selector, text) => {
    const el = await driver.$(selector);
    await el.waitForDisplayed({ timeout: 20000 });
    await tapEl(el);
    try {
      await el.clearValue();
    } catch {
      // ignore
    }
    await driver.execute('mobile: type', { text: String(text) });
  };

  const ensureLoggedIn = async () => {
    let src = await driver.getPageSource();

    // Already on main shell with Buy Shares — skip login
    if (/Buy Shares/i.test(src) && !/Sign in/i.test(src)) {
      console.log('2a) Already on main shell (skip login)');
      return;
    }

    const profile = await driver.$('~Profile');
    if (await profile.isExisting()) {
      await tapEl(profile);
      await driver.pause(1200);
      src = await driver.getPageSource();
      if (!/Profile is locked|~Sign In|content-desc="Sign In"/i.test(src) && !/Sign In/i.test(src)) {
        console.log('2a) Already logged in');
        await backUntil((s) => /Buy Shares|Marketplace|Home|Net Worth/i.test(s));
        return;
      }
      // Guest: open Sign In
      const signIn = await driver.$('~Sign In');
      if (await signIn.isExisting()) {
        await tapEl(signIn);
        await driver.pause(1500);
      } else {
        // Scroll profile for Sign In
        for (let i = 0; i < 4; i += 1) {
          const s = await driver.$('~Sign In');
          if (await s.isExisting()) {
            await tapEl(s);
            await driver.pause(1500);
            break;
          }
          await driver.execute('mobile: scrollGesture', {
            left: 100, top: 600, width: 800, height: 1200, direction: 'up', percent: 0.6,
          });
        }
      }
    }

    const emailTab = await driver.$('~Email');
    if (await emailTab.isExisting()) {
      await tapEl(emailTab);
      await driver.pause(800);
    }

    const edits = await driver.$$('android.widget.EditText');
    if (edits.length >= 2) {
      console.log('2b) Logging in with email');
      await tapEl(edits[0]);
      await edits[0].clearValue().catch(() => {});
      await driver.execute('mobile: type', { text: EMAIL });
      await tapEl(edits[1]);
      await edits[1].clearValue().catch(() => {});
      await driver.execute('mobile: type', { text: PASSWORD });
      await tapDescContains('Sign in');
      await driver.pause(4000);
    } else if (edits.length === 1) {
      console.log('2b) Single field login form — skip');
    } else {
      console.log('2a) No login form — continue');
    }
  };

  const openBuyShares = async () => {
    // Prefer exact bottom-nav tab, not project cards that also say "Buy Shares"
    for (const sel of ['~Buy Shares', '//*[@content-desc="Buy Shares"]']) {
      const el = await driver.$(sel);
      if (await el.isExisting()) {
        await tapEl(el);
        await driver.pause(1500);
        return true;
      }
    }
    // Bottom-nav approx (center-right of tab bar)
    await tapCoords(648, 2270);
    await driver.pause(1500);
    return false;
  };

  const selectBkash = async () => {
    const exact = await driver.$(
      '//*[contains(@content-desc,"bKash") or contains(@content-desc,"Bkash") or contains(@content-desc,"bkash")]'
    );
    if (await exact.isExisting()) {
      await tapEl(exact);
      console.log('7) Selected bKash');
      return;
    }
    // Recommended tile often lists bKash first — scroll if needed
    for (let i = 0; i < 3; i += 1) {
      const again = await driver.$(
        '//*[contains(@content-desc,"bKash") or contains(@content-desc,"Recommended")]'
      );
      if (await again.isExisting()) {
        await tapEl(again);
        console.log('7) Selected bKash / Recommended');
        return;
      }
      await driver.execute('mobile: scrollGesture', {
        left: 80, top: 700, width: 900, height: 1000, direction: 'up', percent: 0.4,
      });
      await driver.pause(600);
    }
    throw new Error('bKash payment option not found on payment method screen');
  };

  const ensureAppForeground = async () => {
    for (let i = 0; i < 8; i += 1) {
      try {
        await driver.activateApp('com.aungsha.app');
      } catch {
        try {
          await driver.startActivity('com.aungsha.app', 'com.aungsha.app.MainActivity');
        } catch {
          // ignore
        }
      }
      await driver.pause(1500);
      try {
        const pkg = await driver.getCurrentPackage();
        console.log('Foreground package:', pkg);
        if (pkg === 'com.aungsha.app') return true;
      } catch {
        // ignore
      }
    }
    return false;
  };

  try {
    // Hard reset into Aungsha (not Android launcher)
    try {
      await driver.terminateApp('com.aungsha.app');
    } catch {
      // ignore
    }
    await driver.pause(1200);
    const fg = await ensureAppForeground();
    if (!fg) {
      throw new Error('Aungsha app not in foreground — stuck on launcher');
    }
    await driver.pause(2500);
    console.log('1) App launched (forced fresh)');

    // Escape Secure Payment / mid-flow screens (stay inside app)
    await backUntil(
      (src) =>
        (/Buy Shares|Marketplace|Net Worth|Home|Profile/i.test(src) &&
          !/Secure Payment/i.test(src) &&
          !/YouTube|Settings|Chrome/i.test(src)) ||
        /Sign in/i.test(src)
    );
    await ensureAppForeground();
    console.log('2) On app shell / login');

    await ensureLoggedIn();
    await driver.pause(1500);
    await ensureAppForeground();

    await backUntil(
      (src) =>
        /Buy Shares|Marketplace|Net Worth|Home/i.test(src) &&
        !/Secure Payment/i.test(src) &&
        !/YouTube|Settings|Chrome/i.test(src)
    );
    await ensureAppForeground();

    await openBuyShares();
    await driver.pause(2500);
    await ensureAppForeground();
    console.log('3) Buy Shares tab');
    await dump('flow-buy-shares');
    {
      const src = await driver.getPageSource();
      if (/YouTube|Google app|Voice search/i.test(src) && !/Cloud 9|Marketplace|Net Worth/i.test(src)) {
        throw new Error('Still on Android launcher after Buy Shares — abort');
      }
    }

    // Open Cloud 9 (Inani) detail — avoid overscrolling past the card
    const openCloud9Detail = async () => {
      const buyNowSel = '//*[contains(@content-desc,"Buy shares now")]';
      const cardSel = `//*[contains(@content-desc,"${PROJECT}")]`;

      if (await (await driver.$(buyNowSel)).isExisting()) return true;

      // Reset list toward top, then nudge down to Cloud 9
      for (let i = 0; i < 3; i += 1) {
        await driver.execute('mobile: scrollGesture', {
          left: 80, top: 700, width: 900, height: 1000, direction: 'down', percent: 0.7,
        });
        await driver.pause(500);
      }

      for (let attempt = 0; attempt < 8; attempt += 1) {
        // Prefer the project CARD (ROI + Buy Shares), not a huge parent container
        let card = await driver.$(
          `//*[contains(@content-desc,"${PROJECT}") and contains(@content-desc,"ROI") and contains(@content-desc,"Buy Shares")]`
        );
        if (!(await card.isExisting())) {
          card = await driver.$(
            `//*[contains(@content-desc,"${PROJECT}") and contains(@content-desc,"MINIMUM PURCHASE")]`
          );
        }
        if (!(await card.isExisting())) {
          card = await driver.$(
            `//*[contains(@content-desc,"${PROJECT}") and contains(@content-desc,"Buy Shares")]`
          );
        }

        if (await card.isExisting()) {
          const loc = await card.getLocation();
          const size = await card.getSize();
          console.log(`4a) Cloud 9 card attempt ${attempt + 1} y=${loc.y} h=${size.height}`);
          // Skip absurd full-screen parent nodes
          if (size.height > 900) {
            console.log('4a) Skipping oversized node, scroll/search again');
          } else {
            await tapCoords(
              Math.round(loc.x + size.width / 2),
              Math.round(loc.y + Math.min(size.height * 0.88, size.height - 15))
            );
            await driver.pause(2800);
            try {
              if (await (await driver.$(buyNowSel)).isExisting()) return true;
            } catch {
              // instrumentation may flake — tap known CTA coords
              await tapCoords(540, 2240);
              await driver.pause(2000);
              try {
                if (await (await driver.$(buyNowSel)).isExisting()) return true;
              } catch {
                return true; // hope CTA worked; next step will verify
              }
            }

            await tapCoords(
              Math.round(loc.x + size.width / 2),
              Math.round(loc.y + size.height * 0.5)
            );
            await driver.pause(2500);
            try {
              if (await (await driver.$(buyNowSel)).isExisting()) return true;
            } catch {
              await tapCoords(540, 2240);
              await driver.pause(1500);
            }
          }
        } else {
          console.log(`4a) Cloud 9 card not visible (${attempt + 1})`);
        }

        await driver.execute('mobile: scrollGesture', {
          left: 80, top: 700, width: 900, height: 1000, direction: 'up', percent: 0.35,
        });
        await driver.pause(800);
      }

      // UiScrollable textContains as last resort
      try {
        const scrolled = await driver.$(
          `android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().descriptionContains("${PROJECT}"))`
        );
        if (await scrolled.isExisting()) {
          await tapEl(scrolled);
          await driver.pause(2500);
          if (await (await driver.$(buyNowSel)).isExisting()) return true;
        }
      } catch (e) {
        console.log('4a) UiScrollable miss', e.message);
      }

      // Absolute CTA coords from prior successful dump
      await tapCoords(540, 2240);
      await driver.pause(1500);
      return (await (await driver.$(buyNowSel)).isExisting());
    };

    const opened = await openCloud9Detail();
    if (!opened) {
      await dump('flow-cloud9-failed');
      throw new Error('Cloud 9 detail / Buy shares now not found');
    }
    console.log('4) Opened Cloud 9 detail');
    await dump('flow-cloud9-detail');

    await tapDescContains('Buy shares now');
    await driver.pause(2500);
    console.log('5) Purchase Details');
    await dump('flow-purchase-details');

    await tapDescContains('Continue');
    await driver.pause(2500);
    console.log('6) Payment method');
    await dump('flow-payment-method');

    // bKash payment method (app sheet) → gateway number / OTP / PIN
    await selectBkash();
    await driver.pause(1200);
    await dump('bkash-payment-selected');

    await tapDescContains('Continue');
    await driver.pause(6000);
    console.log('8) Secure Payment / bKash gateway');
    await dump('bkash-secure-payment');

    const fillWebField = async (selectors, value, label) => {
      for (const sel of selectors) {
        const el = await driver.$(sel);
        if (await el.isExisting()) {
          await el.click();
          await el.clearValue().catch(() => {});
          await el.setValue(String(value));
          console.log(`9) Filled ${label} via`, sel, '=', value);
          return true;
        }
      }
      return false;
    };

    const tapWebAction = async (selectors, label) => {
      for (const sel of selectors) {
        const el = await driver.$(sel);
        if (await el.isExisting()) {
          await el.click().catch(() => {});
          console.log(`9) Tapped ${label} via`, sel);
          return true;
        }
      }
      await driver.execute((needles) => {
        const nodes = [...document.querySelectorAll('button,a,input[type="submit"],div,span')];
        const el = nodes.find((n) =>
          needles.some((t) => new RegExp(t, 'i').test((n.textContent || n.value || '').trim()))
        );
        if (el) el.click();
      }, ['confirm', 'proceed', 'continue', 'pay', 'submit', 'next', 'ok']);
      console.log(`9) Forced ${label} via JS`);
      return true;
    };

    const contexts = await driver.getContexts();
    console.log('Contexts:', contexts);
    const webCtx = contexts.find((c) => String(c).toUpperCase().includes('WEBVIEW'));
    if (webCtx) {
      await driver.switchContext(webCtx);
      await driver.pause(2500);
      fs.writeFileSync(path.join(outDir, 'bkash-gateway.html'), await driver.getPageSource());
      console.log('9) In WEBVIEW — bKash number / OTP / PIN');

      // Prefer bKash tab/tile if gateway shows multiple wallets
      for (const sel of ['*=bKash', '*=bkash', '#bkash', 'a[href*="bkash"]']) {
        const tab = await driver.$(sel);
        if (await tab.isExisting()) {
          await tab.click().catch(() => {});
          console.log('9a) Opened bKash via', sel);
          await driver.pause(1500);
          break;
        }
      }
      fs.writeFileSync(path.join(outDir, 'bkash-form.html'), await driver.getPageSource());

      // 1) Wallet / mobile number
      const numberFilled = await fillWebField(
        [
          'input[maxlength="11"]',
          'input[name*="mobile" i]',
          'input[id*="mobile" i]',
          'input[placeholder*="mobile" i]',
          'input[placeholder*="number" i]',
          'input[type="tel"]',
          'input[type="text"]',
        ],
        BKASH.number,
        'bKash number'
      );
      if (!numberFilled) throw new Error('bKash mobile number field not found');
      await tapWebAction(
        ['button*=Confirm', 'button*=Proceed', 'button*=Continue', 'button*=Next', 'button.paynow_btn', 'button*=Pay'],
        'Confirm number'
      );
      await driver.pause(2500);
      fs.writeFileSync(path.join(outDir, 'bkash-after-number.html'), await driver.getPageSource());

      // 2) OTP
      const otpFilled = await fillWebField(
        [
          'input[maxlength="6"]',
          'input[name*="otp" i]',
          'input[id*="otp" i]',
          'input[placeholder*="otp" i]',
          'input[placeholder*="OTP" i]',
          'input[type="password"]',
          'input[type="tel"]',
          'input[type="text"]',
        ],
        BKASH.otp,
        'OTP'
      );
      if (!otpFilled) console.log('9b) OTP field not found yet — retry after pause');
      await tapWebAction(
        ['button*=Confirm', 'button*=Verify', 'button*=Continue', 'button*=Next', 'button*=Submit'],
        'Confirm OTP'
      );
      await driver.pause(2500);
      fs.writeFileSync(path.join(outDir, 'bkash-after-otp.html'), await driver.getPageSource());

      // 3) PIN
      const pinFilled = await fillWebField(
        [
          'input[name*="pin" i]',
          'input[id*="pin" i]',
          'input[placeholder*="pin" i]',
          'input[placeholder*="PIN" i]',
          'input[type="password"]',
          'input[maxlength="5"]',
          'input[type="tel"]',
          'input[type="text"]',
        ],
        BKASH.pin,
        'PIN'
      );
      if (!pinFilled) throw new Error('bKash PIN field not found');
      await tapWebAction(
        ['button*=Confirm', 'button*=Pay', 'button.paynow_btn', 'button*=Submit', 'button*=Continue'],
        'Confirm PIN / Pay'
      );
      console.log('10) Submitted bKash payment');

      await driver.pause(8000);
      await driver.switchContext('NATIVE_APP');
    } else {
      console.log('9) No WEBVIEW — trying native bKash fields');
      const edits = await driver.$$('android.widget.EditText');
      if (edits.length >= 1) {
        await tapEl(edits[0]);
        await driver.execute('mobile: type', { text: BKASH.number });
        const cont = await driver.$(
          '//*[contains(@content-desc,"Confirm") or contains(@content-desc,"Continue") or contains(@content-desc,"Proceed")]'
        );
        if (await cont.isExisting()) await tapEl(cont);
        await driver.pause(2000);
      }
      const edits2 = await driver.$$('android.widget.EditText');
      if (edits2.length >= 1) {
        await tapEl(edits2[0]);
        await driver.execute('mobile: type', { text: BKASH.otp });
        const cont2 = await driver.$(
          '//*[contains(@content-desc,"Confirm") or contains(@content-desc,"Verify") or contains(@content-desc,"Continue")]'
        );
        if (await cont2.isExisting()) await tapEl(cont2);
        await driver.pause(2000);
      }
      const edits3 = await driver.$$('android.widget.EditText');
      if (edits3.length >= 1) {
        await tapEl(edits3[0]);
        await driver.execute('mobile: type', { text: BKASH.pin });
        const pay = await driver.$(
          '//*[contains(@content-desc,"Confirm") or contains(@content-desc,"Pay") or contains(@text,"Pay")]'
        );
        if (await pay.isExisting()) await tapEl(pay);
        console.log('10) Submitted native bKash');
      }
      await driver.pause(5000);
    }

    let buyOk = false;
    let receiptOk = false;

    await dump('flow-final');
    const finalSrc = await driver.getPageSource();
    buyOk = /Success|successful|Thank you|Purchase|Portfolio|Home|Share Purchased|View Receipt/i.test(
      finalSrc
    );
    console.log(buyOk ? 'BUY_FLOW_OK' : 'BUY_FLOW_REACHED_PAYMENT');

    // Post-purchase: View Receipt + View Share Certificate (+ download/save)
    const waitForReceiptUi = async (timeoutMs = 60000) => {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        try {
          await driver.switchContext('NATIVE_APP');
        } catch {
          // ignore
        }
        const src = await driver.getPageSource();
        if (/View Receipt/i.test(src)) return true;
        await driver.pause(1500);
      }
      return false;
    };

    const openAndDownload = async (label, tag) => {
      const el = await driver.$(`//*[contains(@content-desc,"${label}")]`);
      if (!(await el.isExisting())) {
        console.log('Missing', label);
        return false;
      }
      await tapEl(el);
      console.log(`11) Opened ${label}`);
      await driver.pause(3000);
      await dump(`flow-${tag}-open`);

      const contexts = await driver.getContexts();
      const web = contexts.find((c) => String(c).toUpperCase().includes('WEBVIEW'));
      if (web) {
        await driver.switchContext(web);
        await driver.pause(1000);
        fs.writeFileSync(path.join(outDir, `flow-${tag}.html`), await driver.getPageSource());
        for (const sel of ['a[download]', 'button*=Download', '*=Download']) {
          const b = await driver.$(sel);
          if (await b.isExisting()) {
            await b.click().catch(() => {});
            console.log(`11b) ${tag} web Download`);
            break;
          }
        }
        await driver.switchContext('NATIVE_APP');
      }

      for (const name of ['Download', 'Save', 'Save as', 'Download PDF', 'Share']) {
        const b = await driver.$(
          `//*[contains(@content-desc,"${name}") or contains(@text,"${name}")]`
        );
        if (await b.isExisting()) {
          await tapEl(b);
          console.log(`11c) ${tag} tapped ${name}`);
          await driver.pause(1500);
          for (const okLabel of ['Save', 'OK', 'Download', 'Allow']) {
            const c = await driver.$(
              `//*[contains(@content-desc,"${okLabel}") or contains(@text,"${okLabel}")]`
            );
            if (await c.isExisting()) {
              await tapEl(c);
              await driver.pause(1000);
            }
          }
          break;
        }
      }

      const more = await driver.$('~More options');
      if (await more.isExisting()) {
        await tapEl(more);
        await driver.pause(800);
        for (const name of ['Download', 'Save', 'Share', 'Print']) {
          const b = await driver.$(
            `//*[contains(@text,"${name}") or contains(@content-desc,"${name}")]`
          );
          if (await b.isExisting()) {
            await tapEl(b);
            console.log(`11d) ${tag} overflow ${name}`);
            await driver.pause(1500);
            break;
          }
        }
      }

      const shotDir = path.join(__dirname, '..', 'apps', 'downloads');
      fs.mkdirSync(shotDir, { recursive: true });
      await driver.saveScreenshot(path.join(shotDir, `${tag}.png`));
      console.log(`11e) Saved screenshot apps/downloads/${tag}.png`);

      for (let i = 0; i < 5; i += 1) {
        const s = await driver.getPageSource();
        if (/View Receipt|View Share Certificate|Share Purchased/i.test(s)) break;
        await driver.back();
        await driver.pause(800);
      }
      return true;
    };

    if (await waitForReceiptUi(90000)) {
      console.log('11) Success UI with Receipt / Certificate');
      await dump('flow-success-receipt-ui');
      const receiptDone = await openAndDownload('View Receipt', 'receipt');
      if (!(await (await driver.$('//*[contains(@content-desc,"View Share Certificate")]')).isExisting())) {
        for (let i = 0; i < 4; i += 1) {
          await driver.back();
          await driver.pause(700);
          if (
            await (
              await driver.$('//*[contains(@content-desc,"View Share Certificate")]')
            ).isExisting()
          ) {
            break;
          }
        }
      }
      const certDone = await openAndDownload('View Share Certificate', 'certificate');
      receiptOk = Boolean(receiptDone && certDone);
      console.log(receiptOk ? 'RECEIPT_CERT_OK' : 'RECEIPT_CERT_PARTIAL');
    } else {
      console.log('RECEIPT_UI_TIMEOUT — payment done but receipt buttons not shown');
    }

    console.log('DONE_PROJECT_BUY_BKASH');
    if (!buyOk || !receiptOk) {
      process.exitCode = 1;
    }
  } finally {
    try {
      await driver.switchContext('NATIVE_APP');
    } catch {
      // ignore
    }
    await driver.deleteSession();
  }
})().catch((err) => {
  console.error(err);
  const line = '='.repeat(56);
  console.log(`\n${line}`);
  console.log('  RESULT: FAILED  — Buy Flow (bKash)');
  console.log(`${line}\n`);
  process.exit(1);
});

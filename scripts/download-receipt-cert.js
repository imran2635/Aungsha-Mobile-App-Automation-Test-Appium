const { remote } = require('webdriverio');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * After purchase success: View Receipt + View Share Certificate and download/save.
 * Also tries Portfolio/Transactions if success screen is gone.
 */
(async () => {
  const driver = await remote({
    hostname: '127.0.0.1',
    port: 4723,
    path: '/',
    capabilities: {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:udid': 'emulator-5554',
      'appium:appPackage': 'com.aungsha.app',
      'appium:appActivity': 'com.aungsha.app.MainActivity',
      'appium:noReset': true,
      'appium:autoGrantPermissions': true,
      'appium:newCommandTimeout': 360,
      'appium:ignoreHiddenApiPolicyError': true,
    },
    logLevel: 'warn',
  });

  const outDir = path.join(__dirname, '..', 'apps', 'locators');
  const dlDir = path.join(__dirname, '..', 'apps', 'downloads');
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(dlDir, { recursive: true });

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

  const tapDesc = async (text, timeout = 15000) => {
    const el = await driver.$(`//*[contains(@content-desc,"${text}")]`);
    await el.waitForExist({ timeout });
    await tapEl(el);
    return true;
  };

  const hasDesc = async (text) => {
    const el = await driver.$(`//*[contains(@content-desc,"${text}")]`);
    return el.isExisting();
  };

  const pullDownloads = (tag) => {
    try {
      const listing = execSync('adb -s emulator-5554 shell ls -lt /sdcard/Download 2>/dev/null', {
        encoding: 'utf8',
      });
      console.log('Download folder:\n', listing.slice(0, 800));
      const files = listing
        .split(/\r?\n/)
        .map((l) => l.trim().split(/\s+/).pop())
        .filter((f) => f && /\.(pdf|png|jpg|jpeg)/i.test(f))
        .slice(0, 5);
      for (const f of files) {
        const local = path.join(dlDir, `${tag}-${f}`);
        try {
          execSync(`adb -s emulator-5554 pull "/sdcard/Download/${f}" "${local}"`, {
            stdio: 'inherit',
          });
          console.log('Pulled', local);
        } catch {
          // ignore
        }
      }
    } catch (e) {
      console.log('pullDownloads:', e.message);
    }
  };

  const tryDownloadOnOpenDoc = async (tag) => {
    await driver.pause(2500);
    await dump(`doc-${tag}-open`);
    let src = await driver.getPageSource();

    // Switch webview if present
    const contexts = await driver.getContexts();
    const web = contexts.find((c) => String(c).toUpperCase().includes('WEBVIEW'));
    if (web) {
      await driver.switchContext(web);
      await driver.pause(1000);
      fs.writeFileSync(path.join(outDir, `doc-${tag}-web.html`), await driver.getPageSource());
      for (const sel of [
        'a[download]',
        'button*=Download',
        '*=Download',
        '#download',
        '.download',
      ]) {
        const el = await driver.$(sel);
        if (await el.isExisting()) {
          await el.click().catch(() => {});
          console.log(tag, 'web download via', sel);
          await driver.pause(2000);
          break;
        }
      }
      await driver.switchContext('NATIVE_APP');
    }

    src = await driver.getPageSource();
    for (const label of [
      'Download',
      'Save',
      'Save as',
      'Save to device',
      'Download PDF',
      'Share',
      'Print',
    ]) {
      const el = await driver.$(`//*[contains(@content-desc,"${label}") or contains(@text,"${label}")]`);
      if (await el.isExisting()) {
        await tapEl(el);
        console.log(tag, 'tapped', label);
        await driver.pause(2000);
        await dump(`doc-${tag}-after-${label.replace(/\s+/g, '-')}`);
        // Confirm save dialogs
        for (const ok of ['Save', 'OK', 'Download', 'Allow', 'Just once']) {
          const btn = await driver.$(`//*[contains(@content-desc,"${ok}") or contains(@text,"${ok}")]`);
          if (await btn.isExisting()) {
            await tapEl(btn);
            console.log(tag, 'confirmed', ok);
            await driver.pause(1500);
          }
        }
        break;
      }
    }

    // Chrome/PDF viewer overflow (3-dot) often top-right
    const more = await driver.$('~More options');
    if (await more.isExisting()) {
      await tapEl(more);
      await driver.pause(1000);
      await dump(`doc-${tag}-more`);
      for (const label of ['Download', 'Save', 'Share', 'Print', 'Open with']) {
        const el = await driver.$(`//*[contains(@text,"${label}") or contains(@content-desc,"${label}")]`);
        if (await el.isExisting()) {
          await tapEl(el);
          console.log(tag, 'overflow', label);
          await driver.pause(2000);
          break;
        }
      }
    }

    // Screenshot fallback of the open document
    const shot = path.join(dlDir, `${tag}-screenshot.png`);
    await driver.saveScreenshot(shot);
    console.log(tag, 'screenshot', shot);

    pullDownloads(tag);

    // Back to success / app
    for (let i = 0; i < 4; i += 1) {
      const s = await driver.getPageSource();
      if (/View Receipt|View Share Certificate|Share Purchased|Home|Portfolio/i.test(s)) break;
      await driver.back();
      await driver.pause(800);
    }
  };

  try {
    await driver.activateApp('com.aungsha.app');
    await driver.pause(2000);

    // Escape secure payment
    for (let i = 0; i < 6; i += 1) {
      const src = await driver.getPageSource();
      if (!/Secure Payment/i.test(src)) break;
      await driver.back();
      await driver.pause(700);
    }

    let src = await driver.getPageSource();
    if (!/View Receipt/i.test(src)) {
      console.log('Success screen not visible — searching Portfolio / Transactions');
      for (const tab of ['Portfolio', 'Home']) {
        const t = await driver.$(`~${tab}`);
        if (await t.isExisting()) {
          await tapEl(t);
          await driver.pause(1500);
        }
      }
      // Transactions shortcut
      if (await hasDesc('Transactions')) {
        await tapDesc('Transactions');
        await driver.pause(2000);
        await dump('rcpt-transactions');
      }
      // Scroll for Cloud 9 / receipt
      for (let i = 0; i < 10; i += 1) {
        src = await driver.getPageSource();
        if (/View Receipt|Share Certificate|Cloud 9/i.test(src)) break;
        await driver.execute('mobile: scrollGesture', {
          left: 100, top: 500, width: 800, height: 1200, direction: 'up', percent: 0.55,
        });
        await driver.pause(600);
      }
      await dump('rcpt-search');

      // Open latest Cloud 9 / purchase row
      for (const label of ['Cloud 9', 'Purchase', 'Buy', 'Shares']) {
        const el = await driver.$(`//*[contains(@content-desc,"${label}")]`);
        if (await el.isExisting()) {
          await tapEl(el);
          console.log('Opened row', label);
          await driver.pause(2000);
          await dump('rcpt-detail');
          if (await hasDesc('View Receipt')) break;
        }
      }
    }

    src = await driver.getPageSource();
    if (!(await hasDesc('View Receipt'))) {
      console.log('RECEIPT_UI_NOT_FOUND — need success screen from fresh buy');
      await dump('rcpt-missing');
      process.exitCode = 2;
      return;
    }

    console.log('1) View Receipt');
    await tapDesc('View Receipt');
    await tryDownloadOnOpenDoc('receipt');

    // Ensure back on screen with certificate button
    if (!(await hasDesc('View Share Certificate'))) {
      for (let i = 0; i < 5; i += 1) {
        await driver.back();
        await driver.pause(700);
        if (await hasDesc('View Share Certificate')) break;
      }
    }

    if (await hasDesc('View Share Certificate')) {
      console.log('2) View Share Certificate');
      await tapDesc('View Share Certificate');
      await tryDownloadOnOpenDoc('certificate');
    } else {
      console.log('View Share Certificate not found after receipt');
    }

    console.log('RECEIPT_CERT_DONE');
  } finally {
    try {
      await driver.switchContext('NATIVE_APP');
    } catch {
      // ignore
    }
    await driver.deleteSession();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

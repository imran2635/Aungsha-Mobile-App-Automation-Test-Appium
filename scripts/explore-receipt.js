const { remote } = require('webdriverio');
const fs = require('fs');
const path = require('path');

/**
 * Explore post-purchase: View Receipt / View Share Certificate.
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
      'appium:newCommandTimeout': 300,
      'appium:ignoreHiddenApiPolicyError': true,
    },
    logLevel: 'warn',
  });

  const out = path.join(__dirname, '..', 'apps', 'locators');
  const dump = async (name) => {
    const xml = await driver.getPageSource();
    fs.writeFileSync(path.join(out, `${name}.xml`), xml);
    const labels = [...new Set([...xml.matchAll(/content-desc="([^"]+)"/g)].map((m) => m[1]))];
    console.log(`\n=== ${name} ===`);
    console.log(labels.filter(Boolean).join('\n'));
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

  try {
    await driver.activateApp('com.aungsha.app');
    await driver.pause(2000);
    await dump('rcpt-00-start');

    // Leave secure payment if any
    for (let i = 0; i < 6; i += 1) {
      const src = await driver.getPageSource();
      if (!/Secure Payment/i.test(src)) break;
      await driver.back();
      await driver.pause(800);
    }

    // Try common tabs for purchases
    for (const tab of ['Portfolio', 'Home', 'Profile', 'Marketplace']) {
      const el = await driver.$(`~${tab}`);
      if (await el.isExisting()) {
        await tapEl(el);
        console.log('Opened', tab);
        await driver.pause(1500);
        await dump(`rcpt-01-${tab}`);
      }
    }

    // Scroll looking for receipt/certificate/Cloud 9 ownership
    for (let i = 0; i < 8; i += 1) {
      const src = await driver.getPageSource();
      const hits = ['View Receipt', 'Receipt', 'Share Certificate', 'Certificate', 'Download', 'Cloud 9']
        .filter((t) => src.includes(t));
      if (hits.length) console.log('SCROLL HIT', i, hits.join(','));
      await dump(`rcpt-02-scroll-${i}`);
      if (/View Receipt|Share Certificate/i.test(src)) break;
      await driver.execute('mobile: scrollGesture', {
        left: 100, top: 500, width: 800, height: 1200, direction: 'up', percent: 0.55,
      });
      await driver.pause(700);
    }

    // Tap anything matching
    for (const label of ['View Receipt', 'View Share Certificate', 'Share Certificate', 'Receipt', 'Download']) {
      const el = await driver.$(`//*[contains(@content-desc,"${label}")]`);
      if (await el.isExisting()) {
        console.log('FOUND', label);
        await tapEl(el);
        await driver.pause(3000);
        await dump(`rcpt-03-after-${label.replace(/\s+/g, '-')}`);
      }
    }
  } finally {
    await driver.deleteSession();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

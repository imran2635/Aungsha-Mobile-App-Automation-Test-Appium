const { remote } = require('webdriverio');
const fs = require('fs');
const path = require('path');

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
    },
    logLevel: 'error',
  });

  const out = path.join(__dirname, '..', 'apps', 'locators');
  const dump = async (name) => {
    const xml = await driver.getPageSource();
    fs.writeFileSync(path.join(out, `${name}.xml`), xml);
    const labels = [...xml.matchAll(/content-desc="([^"]+)"/g)].map((m) => m[1]);
    const texts = [...xml.matchAll(/text="([^"]+)"/g)].map((m) => m[1]);
    console.log(`\n=== ${name} DESC ===`);
    console.log([...new Set(labels)].filter(Boolean).join('\n'));
    console.log(`=== ${name} TEXT ===`);
    console.log([...new Set(texts)].filter(Boolean).slice(0, 60).join('\n'));
  };

  const tapContains = async (text) => {
    const el = await driver.$(`//*[contains(@content-desc,"${text}")]`);
    await el.waitForExist({ timeout: 20000 });
    const loc = await el.getLocation();
    const size = await el.getSize();
    await driver.execute('mobile: clickGesture', {
      x: Math.round(loc.x + size.width / 2),
      y: Math.round(loc.y + size.height / 2),
    });
  };

  try {
    // Assume already on detail from previous, or navigate
    await driver.activateApp('com.aungsha.app');
    await driver.pause(1000);
    let src = await driver.getPageSource();
    if (!/Buy shares now/i.test(src)) {
      await (await driver.$('~Buy Shares')).click();
      await driver.pause(1500);
      await driver.execute('mobile: scrollGesture', {
        left: 100, top: 700, width: 800, height: 1000, direction: 'up', percent: 0.45,
      });
      await driver.pause(800);
      const card = await driver.$('//*[contains(@content-desc,"Cloud 9 (Inani)")]');
      const loc = await card.getLocation();
      const size = await card.getSize();
      await driver.execute('mobile: clickGesture', {
        x: Math.round(loc.x + size.width / 2),
        y: Math.round(loc.y + size.height * 0.85),
      });
      await driver.pause(2500);
    }

    await dump('buy-30-detail');
    await tapContains('Buy shares now');
    console.log('Clicked Buy shares now');
    await driver.pause(3000);
    await dump('buy-31-purchase');

    for (let i = 0; i < 4; i += 1) {
      await driver.execute('mobile: scrollGesture', {
        left: 100, top: 500, width: 800, height: 1100, direction: 'up', percent: 0.55,
      });
      await driver.pause(700);
    }
    await dump('buy-32-purchase-scrolled');

    // Try common next actions
    for (const label of ['Sandbox', 'SurjoPay', 'ShurjoPay', 'Continue', 'Confirm', 'Pay', 'Checkout', 'Wallet']) {
      const el = await driver.$(`//*[contains(@content-desc,"${label}") or contains(@text,"${label}")]`);
      if (await el.isExisting()) console.log('VISIBLE:', label);
    }
  } finally {
    await driver.deleteSession();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

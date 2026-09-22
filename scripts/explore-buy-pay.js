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
    console.log(`\n=== ${name} ===`);
    console.log([...new Set(labels)].filter(Boolean).join('\n'));
  };

  const tapDesc = async (text) => {
    const el = await driver.$(`//*[contains(@content-desc,"${text}")]`);
    await el.waitForExist({ timeout: 20000 });
    const loc = await el.getLocation();
    const size = await el.getSize();
    await driver.execute('mobile: clickGesture', {
      x: Math.round(loc.x + size.width / 2),
      y: Math.round(loc.y + Math.min(size.height / 2, size.height * 0.7)),
    });
  };

  try {
    await driver.activateApp('com.aungsha.app');
    await driver.pause(1000);
    let src = await driver.getPageSource();

    if (!/Purchase Details/i.test(src)) {
      await (await driver.$('~Buy Shares')).click();
      await driver.pause(1200);
      await driver.execute('mobile: scrollGesture', {
        left: 100, top: 700, width: 800, height: 1000, direction: 'up', percent: 0.45,
      });
      await driver.pause(600);
      const card = await driver.$('//*[contains(@content-desc,"Cloud 9 (Inani)")]');
      const loc = await card.getLocation();
      const size = await card.getSize();
      await driver.execute('mobile: clickGesture', {
        x: Math.round(loc.x + size.width / 2),
        y: Math.round(loc.y + size.height * 0.85),
      });
      await driver.pause(2000);
      await tapDesc('Buy shares now');
      await driver.pause(2000);
    }

    await tapDesc('Continue');
    console.log('Clicked Continue');
    await driver.pause(3000);
    await dump('buy-40-after-continue');

    for (let i = 0; i < 5; i += 1) {
      await driver.execute('mobile: scrollGesture', {
        left: 100, top: 500, width: 800, height: 1100, direction: 'up', percent: 0.5,
      });
      await driver.pause(500);
    }
    await dump('buy-41-scrolled');

    src = await driver.getPageSource();
    for (const label of ['Sandbox', 'Surjo', 'Shurjo', 'Pay', 'Wallet', 'bKash', 'Nagad', 'Card', 'Confirm', 'Continue']) {
      if (new RegExp(label, 'i').test(src)) console.log('HAS:', label);
    }

    // Click payment related if found
    for (const label of ['SurjoPay', 'ShurjoPay', 'Sandbox', 'Continue', 'Confirm & Pay', 'Pay Now', 'Confirm']) {
      const el = await driver.$(`//*[contains(@content-desc,"${label}")]`);
      if (await el.isExisting()) {
        console.log('Clicking', label);
        const loc = await el.getLocation();
        const size = await el.getSize();
        await driver.execute('mobile: clickGesture', {
          x: Math.round(loc.x + size.width / 2),
          y: Math.round(loc.y + size.height / 2),
        });
        await driver.pause(3000);
        await dump(`buy-42-${label.replace(/\s|&/g, '-')}`);
        break;
      }
    }
  } finally {
    await driver.deleteSession();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

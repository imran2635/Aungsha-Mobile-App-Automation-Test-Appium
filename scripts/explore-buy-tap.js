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
      'appium:newCommandTimeout': 300,
    },
    logLevel: 'error',
  });

  const out = path.join(__dirname, '..', 'apps', 'locators');
  fs.mkdirSync(out, { recursive: true });

  const dump = async (name) => {
    const xml = await driver.getPageSource();
    fs.writeFileSync(path.join(out, `${name}.xml`), xml);
    const labels = [...xml.matchAll(/content-desc="([^"]+)"/g)].map((m) => m[1]);
    console.log(`\n=== ${name} ===`);
    console.log([...new Set(labels)].filter(Boolean).slice(0, 100).join('\n'));
  };

  try {
    await driver.activateApp('com.aungsha.app');
    await driver.pause(1500);
    await (await driver.$('~Buy Shares')).click();
    await driver.pause(2000);

    // Scroll list so Cloud 9 sits mid-screen
    await driver.execute('mobile: scrollGesture', {
      left: 100, top: 700, width: 800, height: 1000, direction: 'up', percent: 0.45,
    });
    await driver.pause(1000);

    const card = await driver.$('//*[contains(@content-desc,"Cloud 9 (Inani)")]');
    await card.waitForExist({ timeout: 15000 });
    const loc = await card.getLocation();
    const size = await card.getSize();
    console.log('Cloud9 bounds', loc, size);

    // Tap Buy Shares area near bottom of card (above system nav)
    const x = Math.round(loc.x + size.width / 2);
    const y = Math.round(loc.y + size.height * 0.85);
    console.log('Tap buy area', x, y);
    await driver.execute('mobile: clickGesture', { x, y });
    await driver.pause(3000);
    await dump('buy-20-after-card-buy');

    // If still on list, try center of card
    let src = await driver.getPageSource();
    if (/3 Properties Available/i.test(src)) {
      console.log('Still on list, tapping card center');
      await driver.execute('mobile: clickGesture', {
        x,
        y: Math.round(loc.y + size.height * 0.4),
      });
      await driver.pause(3000);
      await dump('buy-21-after-card-center');
      src = await driver.getPageSource();
    }

    // Continue tapping common CTAs
    for (const label of ['Buy Shares', 'Buy Now', 'Continue', 'Confirm', 'Pay Now', 'Checkout', 'SurjoPay', 'ShurjoPay', 'Sandbox']) {
      if (src.includes(label) || src.includes(label.toLowerCase())) {
        console.log('Label present:', label);
      }
    }
  } finally {
    await driver.deleteSession();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

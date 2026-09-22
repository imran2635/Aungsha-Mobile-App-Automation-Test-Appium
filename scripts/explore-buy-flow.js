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
    console.log([...new Set(labels)].filter(Boolean).join('\n'));
  };

  try {
    await driver.activateApp('com.aungsha.app');
    await driver.pause(2000);
    await dump('buy-00-home');

    // Marketplace
    const market = await driver.$('~Marketplace');
    if (await market.isExisting()) {
      await market.click();
      await driver.pause(2000);
    }
    await dump('buy-01-marketplace');

    // Scroll looking for Cloud 9
    for (let i = 0; i < 6; i += 1) {
      const src = await driver.getPageSource();
      if (/Cloud\s*9|Inani/i.test(src)) {
        console.log('Found Cloud 9 / Inani on screen at scroll', i);
        break;
      }
      await driver.execute('mobile: scrollGesture', {
        left: 100,
        top: 500,
        width: 800,
        height: 1200,
        direction: 'up',
        percent: 0.6,
      });
      await driver.pause(800);
    }
    await dump('buy-02-after-scroll');

    // Try Buy Shares tab too
    const buyShares = await driver.$('~Buy Shares');
    if (await buyShares.isExisting()) {
      await buyShares.click();
      await driver.pause(2000);
      await dump('buy-03-buy-shares');
    }
  } finally {
    await driver.deleteSession();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

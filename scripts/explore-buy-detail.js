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
    console.log([...new Set(labels)].filter(Boolean).slice(0, 80).join('\n'));
  };

  const tapDescContains = async (text) => {
    const el = await driver.$(`//*[contains(@content-desc,"${text}")]`);
    await el.waitForExist({ timeout: 15000 });
    const loc = await el.getLocation();
    const size = await el.getSize();
    await driver.execute('mobile: clickGesture', {
      x: Math.round(loc.x + size.width / 2),
      y: Math.round(loc.y + size.height / 2),
    });
  };

  try {
    await driver.activateApp('com.aungsha.app');
    await driver.pause(1500);

    const buyTab = await driver.$('~Buy Shares');
    await buyTab.click();
    await driver.pause(2000);

    await tapDescContains('Cloud 9 (Inani)');
    console.log('Tapped Cloud 9 card');
    await driver.pause(2500);
    await dump('buy-10-cloud9-detail');

    // Try tapping Buy Shares on detail
    for (const label of ['Buy Shares', 'Buy Now', 'Buy', 'Continue', 'Purchase']) {
      const el = await driver.$(`//*[contains(@content-desc,"${label}")]`);
      if (await el.isExisting()) {
        console.log('Found action:', label);
      }
    }

    // Prefer a dedicated Buy button near bottom
    const actions = ['Buy Shares', 'Buy Now', 'Continue', 'Buy'];
    for (const label of actions) {
      const el = await driver.$(`~${label}`);
      if (await el.isExisting()) {
        const loc = await el.getLocation();
        const size = await el.getSize();
        await driver.execute('mobile: clickGesture', {
          x: Math.round(loc.x + size.width / 2),
          y: Math.round(loc.y + size.height / 2),
        });
        console.log('Clicked', label);
        await driver.pause(2500);
        await dump(`buy-11-after-${label.replace(/\s+/g, '-')}`);
        break;
      }
    }

    // Scroll dump more labels
    for (let i = 0; i < 3; i += 1) {
      await driver.execute('mobile: scrollGesture', {
        left: 100, top: 500, width: 800, height: 1100, direction: 'up', percent: 0.5,
      });
      await driver.pause(600);
    }
    await dump('buy-12-scrolled');
  } finally {
    await driver.deleteSession();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

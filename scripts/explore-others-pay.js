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
      'appium:chromeOptions': { w3c: true },
    },
    logLevel: 'error',
  });

  const out = path.join(__dirname, '..', 'apps', 'locators');
  const dump = async (name) => {
    const xml = await driver.getPageSource();
    fs.writeFileSync(path.join(out, `${name}.xml`), xml);
    const labels = [...xml.matchAll(/content-desc="([^"]+)"/g)].map((m) => m[1]);
    const texts = [...xml.matchAll(/text="([^"]+)"/g)].map((m) => m[1]);
    console.log(`\n=== ${name} ===`);
    console.log('DESC:', [...new Set(labels)].filter(Boolean).join(' | '));
    console.log('TEXT:', [...new Set(texts)].filter(Boolean).slice(0, 40).join(' | '));
  };

  try {
    await driver.activateApp('com.aungsha.app');
    await driver.pause(1000);
    let src = await driver.getPageSource();

    // Navigate to payment method if needed
    if (!/Choose payment method/i.test(src)) {
      console.log('Navigating to payment method...');
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
      const buyNow = await driver.$('//*[contains(@content-desc,"Buy shares now")]');
      const bLoc = await buyNow.getLocation();
      const bSize = await buyNow.getSize();
      await driver.execute('mobile: clickGesture', {
        x: Math.round(bLoc.x + bSize.width / 2),
        y: Math.round(bLoc.y + bSize.height / 2),
      });
      await driver.pause(2000);
      const cont = await driver.$('~Continue');
      const cLoc = await cont.getLocation();
      const cSize = await cont.getSize();
      await driver.execute('mobile: clickGesture', {
        x: Math.round(cLoc.x + cSize.width / 2),
        y: Math.round(cLoc.y + cSize.height / 2),
      });
      await driver.pause(2000);
    }

    // Select Others (VISA + more) — SurjoPay often under others
    await driver.execute('mobile: clickGesture', { x: 540, y: 1944 });
    console.log('Selected Others');
    await driver.pause(1000);
    await dump('buy-50-others');

    await driver.execute('mobile: clickGesture', { x: 540, y: 2220 });
    console.log('Continue payment');
    await driver.pause(5000);
    await dump('buy-51-secure');

    const contexts = await driver.getContexts();
    console.log('CONTEXTS:', contexts);
    for (const ctx of contexts) {
      if (String(ctx).toUpperCase().includes('WEBVIEW')) {
        await driver.switchContext(ctx);
        await driver.pause(2000);
        const html = await driver.getPageSource();
        fs.writeFileSync(path.join(out, 'buy-52-webview.html'), html);
        console.log('WEBVIEW len', html.length);
        const snippet = html.replace(/\s+/g, ' ').slice(0, 2000);
        console.log('WEBVIEW snippet:', snippet);
        break;
      }
    }
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

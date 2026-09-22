const { remote } = require('webdriverio');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const appConfig = require('../src/config/AppConfig');

(async () => {
  const driver = await remote({
    hostname: appConfig.appiumHost,
    port: appConfig.appiumPort,
    path: '/',
    capabilities: appConfig.getCapabilities(),
    logLevel: 'error',
  });

  try {
    await driver.activateApp(appConfig.appPackage);
    await driver.pause(3000);

    const profile = await driver.$('~Profile');
    if (await profile.isExisting()) {
      await profile.click();
      await driver.pause(1500);
    }

    for (let i = 0; i < 4; i++) {
      const signIn = await driver.$('~Sign In');
      if (await signIn.isExisting()) {
        await signIn.click();
        break;
      }
      await driver.execute('mobile: scrollGesture', {
        left: 100, top: 600, width: 800, height: 1200, direction: 'up', percent: 0.7,
      });
    }

    await driver.pause(2500);
    const src = await driver.getPageSource();
    const out = path.join(__dirname, '..', 'apps', 'source-login.xml');
    fs.writeFileSync(out, src);
    console.log('Wrote', out, 'bytes', src.length);

    const descs = [...src.matchAll(/content-desc="([^"]+)"/g)].map((m) => m[1]);
    console.log([...new Set(descs)].join('\n'));
  } finally {
    await driver.deleteSession();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

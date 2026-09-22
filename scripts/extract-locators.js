const { remote } = require('webdriverio');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const appConfig = require('../src/config/AppConfig');

function extractLocators(xml) {
  const rows = [];
  const nodeRe = /<[^>]*?(?:content-desc|resource-id|text|class|bounds|clickable|password)="[^"]*"[^>]*\/?>/g;
  const nodes = xml.match(nodeRe) || [];

  for (const node of nodes) {
    const get = (attr) => {
      const m = node.match(new RegExp(`${attr}="([^"]*)"`));
      return m ? m[1] : '';
    };
    const contentDesc = get('content-desc');
    const resourceId = get('resource-id');
    const text = get('text');
    const cls = get('class');
    const bounds = get('bounds');
    const clickable = get('clickable');
    const password = get('password');

    if (!contentDesc && !resourceId && !text && password !== 'true' && !cls.includes('EditText')) {
      continue;
    }

    const strategies = [];
    if (contentDesc) {
      strategies.push({ strategy: 'accessibility id', selector: contentDesc, wdio: `~${contentDesc}` });
      strategies.push({
        strategy: 'xpath',
        selector: `//*[@content-desc="${contentDesc}"]`,
        wdio: `//*[@content-desc="${contentDesc}"]`,
      });
    }
    if (resourceId) {
      strategies.push({ strategy: 'id', selector: resourceId, wdio: `id=${resourceId}` });
    }
    if (text) {
      strategies.push({
        strategy: 'xpath',
        selector: `//*[@text="${text}"]`,
        wdio: `//*[@text="${text}"]`,
      });
    }
    if (cls.includes('EditText') || password === 'true') {
      strategies.push({
        strategy: 'class name',
        selector: 'android.widget.EditText',
        wdio: 'android.widget.EditText',
      });
    }

    if (strategies.length) {
      rows.push({
        contentDesc,
        resourceId,
        text,
        class: cls,
        bounds,
        clickable,
        password,
        strategies,
      });
    }
  }

  return rows;
}

(async () => {
  const caps = appConfig.getCapabilities();
  caps['appium:udid'] = process.env.DEVICE_UDID || 'emulator-5554';

  const driver = await remote({
    hostname: appConfig.appiumHost,
    port: appConfig.appiumPort,
    path: '/',
    capabilities: caps,
    logLevel: 'warn',
  });

  const outDir = path.join(__dirname, '..', 'apps', 'locators');
  fs.mkdirSync(outDir, { recursive: true });

  try {
    await driver.activateApp(appConfig.appPackage);
    await driver.pause(2500);

    // Navigate: Profile -> Sign In (guest flow)
    const profile = await driver.$('~Profile');
    if (await profile.isExisting()) {
      await profile.click();
      await driver.pause(1500);
    }

    for (let i = 0; i < 5; i += 1) {
      const signIn = await driver.$('~Sign In');
      if (await signIn.isExisting()) {
        fs.writeFileSync(path.join(outDir, '01-profile.xml'), await driver.getPageSource());
        await signIn.click();
        break;
      }
      await driver.execute('mobile: scrollGesture', {
        left: 100,
        top: 600,
        width: 800,
        height: 1200,
        direction: 'up',
        percent: 0.7,
      });
    }

    await driver.pause(2500);
    const loginXml = await driver.getPageSource();
    fs.writeFileSync(path.join(outDir, '02-login.xml'), loginXml);

    const locators = extractLocators(loginXml);
    fs.writeFileSync(path.join(outDir, 'login-locators.json'), JSON.stringify(locators, null, 2));

    const summary = locators
      .filter(
        (r) =>
          /email|password|sign|login|continue|submit|otp/i.test(
            `${r.contentDesc} ${r.text} ${r.resourceId}`
          ) ||
          r.password === 'true' ||
          (r.class || '').includes('EditText')
      )
      .map((r) => ({
        label: r.contentDesc || r.text || r.resourceId || r.class,
        clickable: r.clickable,
        password: r.password,
        class: r.class,
        bounds: r.bounds,
        best: r.strategies[0],
        all: r.strategies,
      }));

    fs.writeFileSync(path.join(outDir, 'login-locators-summary.json'), JSON.stringify(summary, null, 2));

    console.log('=== LOGIN SCREEN LOCATORS ===');
    for (const item of summary) {
      console.log(`\n[${item.label}] class=${item.class} clickable=${item.clickable} password=${item.password}`);
      console.log(`  bounds: ${item.bounds}`);
      console.log(`  best: ${item.best.strategy} => ${item.best.wdio}`);
    }
    console.log(`\nSaved to ${outDir}`);
  } finally {
    await driver.deleteSession();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

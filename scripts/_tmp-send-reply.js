const { remote } = require('webdriverio');

(async () => {
  const driver = await remote({
    hostname: '127.0.0.1',
    port: 4723,
    path: '/',
    logLevel: 'warn',
    capabilities: {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': 'Android',
      'appium:appPackage': 'com.aungsha.app',
      'appium:appActivity': '.MainActivity',
      'appium:noReset': true,
      'appium:fullReset': false,
      'appium:dontStopAppOnReset': true,
      'appium:autoGrantPermissions': true,
      'appium:newCommandTimeout': 120,
      'appium:ignoreHiddenApiPolicyError': true,
      'appium:uiautomator2ServerLaunchTimeout': 120000,
      'appium:adbExecTimeout': 60000,
    },
  });

  try {
    await driver.pause(1000);
    try {
      await driver.hideKeyboard();
    } catch {
      // ignore
    }

    const fields = await driver.$$('android.widget.EditText');
    const el = fields[fields.length - 1];
    if (el) {
      await el.click();
      await driver.pause(300);
      // clear junk
      await driver.execute('mobile: type', { text: '' }).catch(() => {});
      try {
        await el.clearValue();
      } catch {
        // Flutter
      }
      await driver.keys([
        ...Array(40).fill('Backspace'),
        ...'please solve my problem'.split(''),
      ]);
      await driver.pause(400);
    }

    try {
      await driver.hideKeyboard();
    } catch {
      // ignore
    }
    await driver.pause(500);

    // Right-side send / paper-plane (keyboard down)
    for (const [x, y] of [
      [996, 2258],
      [990, 2200],
      [996, 2250],
      [1005, 2265],
    ]) {
      console.log(`clickGesture ${x},${y}`);
      await driver.execute('mobile: clickGesture', { x, y });
      await driver.pause(800);
    }

    await driver.pause(1500);
    const src = await driver.getPageSource();
    const bubbles = (src.match(/please solve my problem/g) || []).length;
    console.log(`REPLY_HITS=${bubbles}`);
    console.log(`STILL_IN_FIELD=${/EditText[^>]*please solve my problem/.test(src)}`);
  } finally {
    try {
      await driver.deleteSession();
    } catch {
      // ignore
    }
  }
})().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});

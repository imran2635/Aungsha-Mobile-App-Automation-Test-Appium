const { remote } = require('webdriverio');

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
      'appium:newCommandTimeout': 240,
    },
    logLevel: 'warn',
  });

  const phone = '01772559986';
  const password = '12345678';

  try {
    await driver.activateApp('com.aungsha.app');
    await driver.pause(1500);

    // Switch to Phone tab
    let phoneTab = await driver.$('~Phone');
    if (!(await phoneTab.isExisting())) {
      phoneTab = await driver.$('//*[@content-desc="Phone" or @text="Phone"]');
    }
    if (await phoneTab.isExisting()) {
      const loc = await phoneTab.getLocation();
      const size = await phoneTab.getSize();
      await driver.execute('mobile: clickGesture', {
        x: Math.round(loc.x + size.width / 2),
        y: Math.round(loc.y + size.height / 2),
      });
      console.log('Clicked Phone tab');
    } else {
      // Left toggle from Inspector/email layout
      await driver.execute('mobile: clickGesture', { x: 300, y: 615 });
      console.log('Clicked Phone tab by coords');
    }

    await driver.pause(1000);

    // Phone number field = first EditText (not password)
    const phoneField = await driver.$('//android.widget.EditText[not(@password="true")]');
    await phoneField.waitForDisplayed({ timeout: 20000 });
    await phoneField.click();
    try {
      await phoneField.clearValue();
    } catch {
      // ignore
    }
    await driver.execute('mobile: type', { text: phone });
    console.log('Typed phone:', phone);

    const passField = await driver.$('//android.widget.EditText[@password="true"]');
    await passField.waitForDisplayed({ timeout: 15000 });
    await passField.click();
    try {
      await passField.clearValue();
    } catch {
      // ignore
    }
    await driver.execute('mobile: type', { text: password });
    console.log('Typed password');

    // Submit: Sign in
    const signIn = await driver.$('~Sign in');
    if (await signIn.isExisting()) {
      const loc = await signIn.getLocation();
      const size = await signIn.getSize();
      await driver.execute('mobile: clickGesture', {
        x: Math.round(loc.x + size.width / 2),
        y: Math.round(loc.y + size.height / 2),
      });
    } else {
      await driver.execute('mobile: clickGesture', { x: 540, y: 1319 });
    }
    console.log('Clicked Sign in');
    await driver.pause(5000);
    console.log('DONE_PHONE_LOGIN');
  } finally {
    await driver.deleteSession();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

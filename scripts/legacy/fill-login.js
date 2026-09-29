const { remote } = require('webdriverio');

/**
 * Full email login from scratch on emulator.
 * Email: imran.bponi@gmail.com / Pass: 12345678
 */
(async () => {
  const email = 'imran.bponi@gmail.com';
  const password = '12345678';

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
      'appium:ignoreHiddenApiPolicyError': true,
    },
    logLevel: 'warn',
  });

  async function tapEl(el) {
    const loc = await el.getLocation();
    const size = await el.getSize();
    await driver.execute('mobile: clickGesture', {
      x: Math.round(loc.x + size.width / 2),
      y: Math.round(loc.y + size.height / 2),
    });
  }

  async function tapSelector(selector, fallback) {
    const el = await driver.$(selector);
    if (await el.isExisting()) {
      await tapEl(el);
      return true;
    }
    if (fallback) {
      await driver.execute('mobile: clickGesture', fallback);
      return true;
    }
    return false;
  }

  try {
    await driver.terminateApp('com.aungsha.app').catch(() => {});
    await driver.activateApp('com.aungsha.app');
    await driver.pause(2500);
    console.log('1) App launched');

    // Open login if needed: Profile -> Sign In
    const emailFieldCheck = await driver.$('//android.widget.EditText[not(@password="true")]');
    if (!(await emailFieldCheck.isExisting())) {
      await tapSelector('~Profile');
      await driver.pause(1200);
      for (let i = 0; i < 4; i += 1) {
        const signInEntry = await driver.$('~Sign In');
        if (await signInEntry.isExisting()) {
          await tapEl(signInEntry);
          console.log('2) Opened Sign In from Profile');
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
      await driver.pause(1500);
    } else {
      console.log('2) Already on login form');
    }

    // Email tab
    await tapSelector('~Email', { x: 766, y: 615 });
    console.log('3) Clicked Email tab');
    await driver.pause(800);

    // Email
    const emailInput = await driver.$('//android.widget.EditText[not(@password="true")]');
    await emailInput.waitForDisplayed({ timeout: 20000 });
    await tapEl(emailInput);
    try {
      await emailInput.clearValue();
    } catch {
      // ignore
    }
    await driver.execute('mobile: type', { text: email });
    console.log('4) Typed email');

    // Password
    const passInput = await driver.$('//android.widget.EditText[@password="true"]');
    await passInput.waitForDisplayed({ timeout: 20000 });
    await tapEl(passInput);
    try {
      await passInput.clearValue();
    } catch {
      // ignore
    }
    await driver.execute('mobile: type', { text: password });
    console.log('5) Typed password');

    // Sign in (lowercase i)
    const submitted = await tapSelector('~Sign in', { x: 540, y: 1319 });
    console.log('6) Clicked Sign in:', submitted);

    await driver.pause(6000);
    const src = await driver.getPageSource();
    const loggedIn = /Net Worth|Marketplace|Home|My Portfolio/i.test(src) && !/Enter your email/i.test(src);
    console.log(loggedIn ? 'LOGIN_OK' : 'LOGIN_DONE_CHECK_UI');
    console.log('DONE_EMAIL_LOGIN');
  } finally {
    await driver.deleteSession();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

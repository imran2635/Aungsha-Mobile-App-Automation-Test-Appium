const fs = require('fs');
const path = require('path');
const BasePage = require('./BasePage');

/**
 * Post-purchase receipt / share certificate.
 */
class ReceiptPage extends BasePage {
  constructor(driver) {
    super(driver);

    this.viewReceipt = ['//*[contains(@content-desc,"View Receipt")]'];
    this.viewCertificate = ['//*[contains(@content-desc,"View Share Certificate")]'];
    this.downloadActions = [
      '//*[contains(@content-desc,"Download") or contains(@text,"Download")]',
      '//*[contains(@content-desc,"Save") or contains(@text,"Save")]',
      'a[download]',
      'button*=Download',
      '*=Download',
    ];
    this.successMarkers = [
      '//*[contains(@content-desc,"View Receipt")]',
      '//*[contains(@content-desc,"View Share Certificate")]',
      '//*[contains(@content-desc,"Share Purchased") or contains(@text,"Share Purchased")]',
      '~Success',
      '~Payment Successful',
      '~Purchase Successful',
      '//*[contains(@content-desc,"Success") or contains(@content-desc,"successful") or contains(@text,"Success")]',
      '//*[contains(@content-desc,"Congratulations") or contains(@text,"Congratulations")]',
    ];
  }

  async waitForSuccess(timeout = 180000) {
    const pkg = 'com.aungsha.app';
    await this.driver.waitUntil(
      async () => {
        try {
          await this.driver.switchContext('NATIVE_APP');
        } catch {
          // ignore
        }
        try {
          return await this.isVisible(this.successMarkers, 2000);
        } catch (err) {
          const msg = String(err && err.message ? err.message : err);
          if (/instrumentation|terminated|not started|cannot be proxied/i.test(msg)) {
            throw err; // bubble — caller can recreate session
          }
          try {
            await this.driver.activateApp(pkg);
          } catch {
            // ignore
          }
          return false;
        }
      },
      {
        timeout,
        interval: 3000,
        timeoutMsg: 'Purchase/payment success screen did not appear',
      }
    );
  }

  async openDownloadable(labelSelectors, shotName) {
    await this.tap(labelSelectors, 20000);
    await this.show(`Opened ${shotName}`);

    try {
      const contexts = await this.driver.getContexts();
      const web = contexts.find((c) => String(c).toUpperCase().includes('WEBVIEW'));
      if (web) {
        await this.driver.switchContext(web);
        if (await this.isVisible(this.downloadActions, 3000)) {
          await this.tap(this.downloadActions);
        }
        await this.driver.switchContext('NATIVE_APP');
      }
    } catch {
      // stay native
    }

    if (await this.isVisible(this.downloadActions, 3000)) {
      await this.tap(this.downloadActions);
      await this.show(`${shotName} download`);
    }

    const dir = path.join(process.cwd(), 'apps', 'downloads');
    fs.mkdirSync(dir, { recursive: true });
    await this.driver.saveScreenshot(path.join(dir, `${shotName}.png`));

    for (let i = 0; i < 5; i += 1) {
      if (await this.isVisible(this.viewReceipt, 800)) break;
      if (await this.isVisible(this.viewCertificate, 800)) break;
      await this.driver.back();
    }
  }

  async captureReceiptAndCertificate() {
    await this.check('Capture receipt + certificate', async () => {
      await this.driver.waitUntil(async () => this.isVisible(this.viewReceipt, 1500), {
        timeout: 90000,
        timeoutMsg: 'View Receipt not shown after payment',
      });
      await this.openDownloadable(this.viewReceipt, 'receipt');
      if (!(await this.isVisible(this.viewCertificate, 2000))) {
        for (let i = 0; i < 4; i += 1) {
          await this.driver.back();
          if (await this.isVisible(this.viewCertificate, 1000)) break;
        }
      }
      await this.openDownloadable(this.viewCertificate, 'certificate');
      await this.show('Receipt + certificate captured');
    });
  }
}

module.exports = ReceiptPage;

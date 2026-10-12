const fs = require('fs');
const path = require('path');
const BasePage = require('./BasePage');

/**
 * Post-purchase receipt / share certificate.
 */
class ReceiptPage extends BasePage {
  constructor(driver) {
    super(driver);

    /** Invoice / receipt entry on success screen */
    this.viewReceipt = [
      '//*[contains(@content-desc,"View Invoice")]',
      '//*[contains(@content-desc,"Invoice")]',
      '//*[contains(@content-desc,"View Receipt")]',
      '~View Invoice',
      '~View Receipt',
      '~Invoice',
    ];
    /** Ownership / share certificate entry */
    this.viewCertificate = [
      '//*[contains(@content-desc,"Ownership Certificate")]',
      '//*[contains(@content-desc,"View Ownership")]',
      '//*[contains(@content-desc,"View Share Certificate")]',
      '//*[contains(@content-desc,"Share Certificate")]',
      '~Ownership Certificate',
      '~View Share Certificate',
    ];
    this.downloadActions = [
      '//*[contains(@content-desc,"Download") or contains(@text,"Download")]',
      '//*[contains(@content-desc,"Save") or contains(@text,"Save")]',
      'a[download]',
      'button*=Download',
      '*=Download',
    ];
    this.successMarkers = [
      ...this.viewReceipt,
      ...this.viewCertificate,
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
    await this.check('Capture Invoice + Ownership Certificate', async () => {
      await this.driver.waitUntil(async () => this.isVisible(this.viewReceipt, 1500), {
        timeout: 90000,
        timeoutMsg: 'Invoice / View Receipt not shown after payment',
      });
      // Prefer Invoice naming for downloads; also keep receipt.png alias via openDownloadable
      await this.openDownloadable(this.viewReceipt, 'invoice');
      await this.driver
        .saveScreenshot(path.join(process.cwd(), 'apps', 'downloads', 'receipt.png'))
        .catch(() => {});
      if (!(await this.isVisible(this.viewCertificate, 2000))) {
        for (let i = 0; i < 4; i += 1) {
          await this.driver.back();
          if (await this.isVisible(this.viewCertificate, 1000)) break;
        }
      }
      await this.openDownloadable(this.viewCertificate, 'ownership-certificate');
      await this.driver
        .saveScreenshot(path.join(process.cwd(), 'apps', 'downloads', 'certificate.png'))
        .catch(() => {});
      await this.show('Invoice + Ownership Certificate captured');
    });
  }
}

module.exports = ReceiptPage;

const BasePage = require('./BasePage');

/**
 * My Listings (active marketplace sell offers) Page Object.
 */
class ListingsPage extends BasePage {
  constructor(driver) {
    super(driver);

    this.myListings = [
      '~My Listings',
      '//*[@content-desc="My Listings"]',
      '//*[contains(@content-desc,"My Listings")]',
      '//*[contains(@content-desc,"My listings")]',
    ];

    this.listingsScreen = [
      '//*[contains(@content-desc,"My Listings")]',
      '//*[contains(@content-desc,"Active")]',
      '//*[contains(@content-desc,"Sell Shares")]',
    ];

    this.activeBadge = [
      '~Active',
      '//*[@content-desc="Active"]',
      '//*[contains(@content-desc,"Active")]',
    ];
  }

  /** Success modal CTA or nav → My Listings. */
  async openMyListings() {
    await this.check('Open My Listings', async () => {
      if (await this.isVisible(this.listingsScreen, 2500)) {
        await this.show('Already on My Listings');
        return;
      }
      if (await this.isVisible(this.myListings, 4000)) {
        await this.tap(this.myListings);
        await this.show('My Listings opened');
        return;
      }
      // Nav / profile area
      for (let i = 0; i < 4; i += 1) {
        if (await this.isVisible(this.myListings, 1500)) {
          await this.tap(this.myListings);
          await this.show('My Listings opened (scroll)');
          return;
        }
        await this.scroll('up', 0.4);
      }
      throw new Error('My Listings not found');
    });
  }

  /**
   * @param {string} [projectName]
   * @param {string|number} [askingPrice]
   */
  async expectActiveListing(projectName, askingPrice) {
    const name =
      projectName || process.env.BUY_PROJECT || process.env.PROJECT_NAME || 'Cloud 9 (Inani)';
    const price = String(askingPrice || process.env.MARKETPLACE_ASKING_PRICE || '2000');
    const formatted = Number(price).toLocaleString('en-US');

    await this.check(`Active listing ${name} @ ৳${price}`, async () => {
      const card = [
        `//*[contains(@content-desc,"${name}") and contains(@content-desc,"${price}")]`,
        `//*[contains(@content-desc,"${name}") and contains(@content-desc,"${formatted}")]`,
        `//*[contains(@content-desc,"${name}") and contains(@content-desc,"Active")]`,
        `//*[contains(@content-desc,"${name}")]`,
      ];
      await this.driver.waitUntil(async () => this.isVisible(card, 2000), {
        timeout: 20000,
        timeoutMsg: `Active listing not found for ${name} @ ${price}`,
      });
      if (await this.isVisible(this.activeBadge, 3000)) {
        await this.show('Active badge visible');
      }
      await this.show(`Active listing visible: ${name}`);
    });
  }
}

module.exports = ListingsPage;

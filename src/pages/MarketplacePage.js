const BasePage = require('./BasePage');

/**
 * Marketplace / project listing Page Object.
 */
class MarketplacePage extends BasePage {
  constructor(driver) {
    super(driver);

    this.marketplaceTab = ['~Marketplace', '//*[@content-desc="Marketplace"]'];
    this.buySharesTab = ['~Buy Shares', '//*[@content-desc="Buy Shares"]'];
    this.cloud9Card = [
      '//*[contains(@content-desc,"Cloud 9 (Inani)")]',
      '~Cloud 9 (Inani)',
    ];
  }

  async openBuyShares() {
    await this.tap(this.buySharesTab);
  }

  /**
   * Scroll Cloud 9 into view and open project detail (skips oversized parents).
   */
  async openCloud9Inani() {
    const buyNow = ['//*[contains(@content-desc,"Buy shares now")]'];
    if (await this.isVisible(buyNow, 1500)) {
      return;
    }

    for (let i = 0; i < 3; i += 1) {
      await this.scroll('down', 0.7);
    }

    const cardSelectors = [
      '//*[contains(@content-desc,"Cloud 9 (Inani)") and contains(@content-desc,"ROI") and contains(@content-desc,"Buy Shares")]',
      '//*[contains(@content-desc,"Cloud 9 (Inani)") and contains(@content-desc,"MINIMUM PURCHASE")]',
      '//*[contains(@content-desc,"Cloud 9 (Inani)") and contains(@content-desc,"Buy Shares")]',
      ...this.cloud9Card,
    ];

    for (let attempt = 0; attempt < 8; attempt += 1) {
      for (const selector of cardSelectors) {
        const el = await this.driver.$(selector);
        if (!(await el.isExisting())) continue;
        const loc = await el.getLocation();
        const size = await el.getSize();
        if (size.height > 900) continue;
        await this.tapAt(
          Math.round(loc.x + size.width / 2),
          Math.round(loc.y + Math.min(size.height * 0.88, size.height - 15))
        );
        await this.show('Cloud 9 card tapped');
        if (await this.isVisible(buyNow, 4000)) return;
        await this.tapAt(
          Math.round(loc.x + size.width / 2),
          Math.round(loc.y + size.height * 0.5)
        );
        if (await this.isVisible(buyNow, 4000)) return;
      }
      await this.scroll('up', 0.35);
    }

    await this.driver.waitUntil(async () => this.isVisible(buyNow, 1500), {
      timeout: 20000,
      timeoutMsg: 'Cloud 9 detail / Buy shares now not found',
    });
  }

  async openMarketplace() {
    await this.tap(this.marketplaceTab);
  }

  async openProject(projectName) {
    const selectors = [
      `~${projectName}`,
      `//*[@content-desc="${projectName}"]`,
      `//*[contains(@content-desc,"${projectName}")]`,
      '//*[contains(@content-desc,"Cloud 9") and contains(@content-desc,"Inani")]',
    ];
    for (let i = 0; i < 8; i += 1) {
      if (await this.isVisible(selectors, 2500)) {
        await this.tap(selectors);
        return;
      }
      await this.scroll('up', 0.65);
    }
    await this.tap(selectors, 20000);
  }
}

module.exports = MarketplacePage;

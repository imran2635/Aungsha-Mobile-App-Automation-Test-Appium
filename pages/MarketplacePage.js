const BasePage = require('./BasePage');

/**
 * Marketplace / project listing Page Object.
 */
class MarketplacePage extends BasePage {
  constructor(driver) {
    super(driver);

    this.marketplaceTab = ['~Marketplace', '//*[@content-desc="Marketplace"]'];
    this.buySharesTab = ['~Buy Shares', '//*[@content-desc="Buy Shares"]'];
    this.projectName =
      process.env.BUY_PROJECT || process.env.PROJECT_NAME || 'Cloud 9 (Inani)';
    /** Tried in order if primary not listed on this build. */
    this.projectFallbacks = [
      this.projectName,
      'Cloud 9 (Inani)',
      'Cloud 9',
      'Price Growth Banani Hotel',
      'Price Growth Hotel',
    ].filter((v, i, a) => v && a.indexOf(v) === i);
  }

  /**
   * Bottom nav "Buy Shares" only — avoid card CTAs with the same label.
   */
  async openBuyShares() {
    await this.check('Open Buy Shares tab', async () => {
      const els = await this.driver.$$('//*[@content-desc="Buy Shares"]');
      let best = null;
      let bestY = -1;
      for (const el of els) {
        if (!(await el.isExisting())) continue;
        const loc = await el.getLocation();
        const size = await el.getSize();
        if (size.height > 150) continue;
        if (loc.y > bestY) {
          bestY = loc.y;
          best = { loc, size };
        }
      }
      if (best) {
        await this.tapAt(
          Math.round(best.loc.x + best.size.width / 2),
          Math.round(best.loc.y + best.size.height / 2)
        );
        await this.show('Buy Shares tab');
        return;
      }
      await this.tap(this.buySharesTab);
      await this.show('Buy Shares tab (fallback)');
    });
  }

  /**
   * Scroll listing thoroughly and open a buyable project detail.
   */
  async openCloud9Inani() {
    const names = this.projectFallbacks;
    await this.check(`Open project (${names[0]})`, async () => {
      const buyNow = ['//*[contains(@content-desc,"Buy shares now")]'];
      if (await this.isVisible(buyNow, 1500)) {
        await this.show('Already on project detail');
        return;
      }

      // Jump toward list top, then walk downward looking for each candidate.
      for (let i = 0; i < 4; i += 1) {
        await this.scroll('down', 0.75);
      }

      for (const name of names) {
        await this.show(`Looking for: ${name}`);
        if (await this._tryOpenProjectCard(name, buyNow)) {
          await this.show(`Opened: ${name}`);
          return;
        }
      }

      await this.driver.waitUntil(async () => this.isVisible(buyNow, 1500), {
        timeout: 5000,
        timeoutMsg: `Project detail / Buy shares now not found (tried: ${names.join(', ')})`,
      });
    });
  }

  /**
   * @private
   * @param {string} name
   * @param {string[]} buyNow
   */
  async _tryOpenProjectCard(name, buyNow) {
    const cardSelectors = [
      `//*[contains(@content-desc,"${name}") and contains(@content-desc,"ROI") and contains(@content-desc,"Buy Shares")]`,
      `//*[contains(@content-desc,"${name}") and contains(@content-desc,"MINIMUM PURCHASE")]`,
      `//*[contains(@content-desc,"${name}") and contains(@content-desc,"Buy Shares")]`,
      `//*[contains(@content-desc,"${name}")]`,
      `~${name}`,
    ];

    for (let attempt = 0; attempt < 6; attempt += 1) {
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
        await this.show(`Tapped card: ${name}`);
        if (await this.isVisible(buyNow, 5000)) return true;
        await this.tapAt(
          Math.round(loc.x + size.width / 2),
          Math.round(loc.y + size.height * 0.5)
        );
        if (await this.isVisible(buyNow, 5000)) return true;
      }
      // Finger up → reveal lower cards
      await this.scroll('up', 0.45);
    }
    return false;
  }

  async openMarketplace() {
    await this.check('Open Marketplace tab', () => this.tap(this.marketplaceTab));
  }

  async openProject(projectName) {
    const name = projectName || this.projectName;
    const buyNow = ['//*[contains(@content-desc,"Buy shares now")]'];
    for (let i = 0; i < 4; i += 1) {
      await this.scroll('down', 0.75);
    }
    if (!(await this._tryOpenProjectCard(name, buyNow))) {
      throw new Error(`Project not found: ${name}`);
    }
  }
}

module.exports = MarketplacePage;

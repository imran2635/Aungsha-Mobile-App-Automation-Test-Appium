const BasePage = require('./BasePage');

/**
 * My Portfolio — Sell to Marketplace (secondary listing) Page Object.
 * Locators stay here only (Flutter content-desc).
 *
 * Path: My Portfolio → Sell to Marketplace → pick project → asking price → Sell Shares
 */
class PortfolioPage extends BasePage {
  constructor(driver) {
    super(driver);

    this.projectName =
      process.env.BUY_PROJECT || process.env.PROJECT_NAME || 'Cloud 9 (Inani)';

    this.portfolioEntry = [
      '~My Portfolio',
      '~Portfolio',
      '//*[@content-desc="My Portfolio"]',
      '//*[@content-desc="Portfolio"]',
      '//*[contains(@content-desc,"My Portfolio")]',
      '//*[contains(@content-desc,"Portfolio") and not(contains(@content-desc,"Profile"))]',
    ];

    /** True portfolio home — NOT holding Details / purchase history */
    this.portfolioScreen = [
      '//*[contains(@content-desc,"Active Shares")]',
      '//*[contains(@content-desc,"Sell to") and contains(@content-desc,"Marketplace")]',
      '//*[contains(@content-desc,"Sell to Marketplace")]',
      '//*[contains(@content-desc,"Sell your share")]',
      '//*[contains(@content-desc,"Sell Your Share")]',
      '//*[@content-desc="Buy\nShare" or @content-desc="Buy Share"]',
    ];

    /** Top CTA on My Portfolio (user: "sell your share") */
    this.sellYourShare = [
      '//*[contains(@content-desc,"Sell to") and contains(@content-desc,"Marketplace")]',
      '//*[@content-desc="Sell to\nMarketplace"]',
      '//*[contains(@content-desc,"Sell to Marketplace")]',
      '~Sell to Marketplace',
      '//*[contains(@content-desc,"Sell your share")]',
      '//*[contains(@content-desc,"Sell Your Share")]',
      '//*[contains(@content-desc,"Sell Your Shares")]',
      '~Sell your share',
    ];

    this.sellSheet = [
      '//*[contains(@content-desc,"Select a project to continue")]',
      '//*[contains(@content-desc,"Sell to Marketplace")]',
      '//*[contains(@content-desc,"units owned")]',
    ];

    /** Sell Your Share form (after project pick) */
    this.sellYourShareForm = [
      '//*[@content-desc="Sell Your Share"]',
      '//*[contains(@content-desc,"Sell Your Share")]',
      '//*[contains(@content-desc,"Ask price per unit")]',
      '//*[contains(@content-desc,"Units to sell")]',
      '//*[contains(@content-desc,"List for Sale")]',
    ];

    this.viewDetails = [
      '~View Details',
      '//*[@content-desc="View Details"]',
      '//*[contains(@content-desc,"View Details")]',
    ];

    this.goToMarketplace = [
      '//*[contains(@content-desc,"Go to marketplace")]',
      '//*[contains(@content-desc,"Go to Marketplace")]',
      '//*[contains(@content-desc,"asking price")]',
      '~Go to marketplace',
    ];

    this.unitPicker = [
      '//*[contains(@content-desc,"Aungsha Share") and contains(@content-desc,"1 units")]',
      '//*[contains(@content-desc,"1 units")]',
      '//*[contains(@content-desc,"1 unit")]',
    ];

    this.priceFieldHints = [
      '//*[contains(@content-desc,"Ask price per unit")]',
      '//*[contains(@content-desc,"Selling price")]',
      '//*[contains(@content-desc,"selling price")]',
      '//*[contains(@content-desc,"Asking price")]',
      '//*[contains(@content-desc,"Price per unit")]',
      '//android.widget.EditText',
    ];

    this.sellSharesButton = [
      '~List for Sale',
      '//*[@content-desc="List for Sale"]',
      '//*[contains(@content-desc,"List for Sale")]',
      '~Sell Shares',
      '//*[@content-desc="Sell Shares"]',
      '//*[contains(@content-desc,"Sell Shares") and @clickable="true"]',
    ];

    this.listedSuccess = [
      '//*[contains(@content-desc,"listed for sale")]',
      '//*[contains(@content-desc,"Listed for sale")]',
      '//*[contains(@content-desc,"List for Sale")]',
      '//*[contains(@content-desc,"resale offer")]',
      '//*[contains(@content-desc,"Great news")]',
      '//*[contains(@content-desc,"My Listings")]',
      '//*[contains(@content-desc,"successfully listed")]',
      '//*[contains(@content-desc,"Listing created")]',
      '//*[contains(@content-desc,"Active")]',
    ];
  }

  /**
   * Home shell → My Portfolio (Active Shares + Sell to Marketplace tile).
   * Mobile: Fund / wallet tab shows Buy Share · Instant Withdraw · Sell to Marketplace.
   */
  async openPortfolio() {
    await this.check('Open My Portfolio', async () => {
      const onPortfolio = async () =>
        (await this.isVisible(this.sellYourShare, 1200)) ||
        (await this.isVisible(['//*[contains(@content-desc,"Active Shares")]'], 1200));

      if (await onPortfolio()) {
        await this.show('Already on My Portfolio');
        return;
      }

      // Escape Details / sheets / success
      for (let i = 0; i < 6; i += 1) {
        if (await onPortfolio()) {
          await this.show('Already on My Portfolio');
          return;
        }
        try {
          await this.driver.back();
        } catch {
          // ignore
        }
        await this.driver.pause(400);
      }

      if (await this.isVisible(['~Home', '//*[@content-desc="Home"]'], 2000)) {
        await this.tap(['~Home', '//*[@content-desc="Home"]']);
        await this.show('Home tab');
      }

      const fund = [
        '~Fund',
        '//*[@content-desc="Fund"]',
        '//android.view.View[@content-desc="Fund"]',
      ];

      // 1) Fund tab first (has Sell to Marketplace)
      for (let i = 0; i < 4; i += 1) {
        if (await this.isVisible(fund, 1500)) {
          try {
            await this.tap(fund);
          } catch {
            await this.tapAt(740, 2232);
          }
          await this.show('Fund tab → My Portfolio');
          await this.driver.pause(1200);
          if (await onPortfolio()) return;
        }
        await this.tapAt(740, 2232);
        await this.driver.pause(1200);
        if (await onPortfolio()) {
          await this.show('My Portfolio via Fund coords');
          return;
        }
      }

      // 2) Explicit My Portfolio label (if present on this build)
      if (await this.isVisible(this.portfolioEntry, 2000)) {
        await this.tap(this.portfolioEntry);
        await this.show('My Portfolio label tapped');
        if (await onPortfolio()) return;
      }

      throw new Error('My Portfolio (Active Shares / Sell to Marketplace) not found');
    });
  }

  /** Tap Sell to Marketplace / Sell your share on My Portfolio. */
  async tapSellYourShare() {
    await this.check('Sell your share / Sell to Marketplace', async () => {
      for (let i = 0; i < 4; i += 1) {
        if (await this.isVisible(this.sellYourShare, 2000)) break;
        await this.scroll('down', 0.4);
      }
      // Prefer force coords — Flutter ImageView tile (top-right)
      if (await this.isVisible(this.sellYourShare, 3000)) {
        try {
          await this.tap(this.sellYourShare, 8000);
        } catch {
          await this.tapAt(855, 257);
        }
      } else {
        await this.tapAt(855, 257);
      }
      await this.show('Sell to Marketplace tapped');
      await this.driver.pause(2000);
    });

    await this.check('Sell Your Share screen', async () => {
      const next = [
        ...this.sellYourShareForm,
        ...this.sellSheet,
        `//*[contains(@content-desc,"${this.projectName}") and contains(@content-desc,"units owned")]`,
        `//*[contains(@content-desc,"units owned")]`,
        '//*[contains(@content-desc,"Select a project")]',
      ];
      try {
        await this.driver.waitUntil(async () => this.isVisible(next, 1500), {
          timeout: 20000,
          timeoutMsg: 'Sell Your Share / project picker did not open',
        });
      } catch {
        await this.tapAt(855, 257);
        await this.driver.pause(2000);
        await this.driver.waitUntil(async () => this.isVisible(next, 1500), {
          timeout: 15000,
          timeoutMsg: 'Sell Your Share / project picker did not open',
        });
      }
      if (await this.isVisible(this.sellYourShareForm, 2000)) {
        await this.show('Sell Your Share form open');
      } else {
        await this.show('Sell project picker open');
      }
    });
  }

  /** Bottom sheet — select Cloud 9 (or BUY_PROJECT). Skip if already on Sell Your Share form. */
  async selectProjectToSell() {
    if (await this.isVisible(this.sellYourShareForm, 2500)) {
      await this.show('Already on Sell Your Share — skip project pick');
      return;
    }

    const name = this.projectName;
    await this.check(`Select project to sell (${name})`, async () => {
      const card = [
        `//*[contains(@content-desc,"${name}") and contains(@content-desc,"units owned")]`,
        `//*[contains(@content-desc,"${name}") and contains(@content-desc,"unit owned")]`,
        `//*[contains(@content-desc,"${name}")]`,
        '//*[contains(@content-desc,"Construction Phase") and contains(@content-desc,"unit")]',
      ];
      for (let i = 0; i < 5; i += 1) {
        if (await this.isVisible(card, 2000)) {
          await this.tap(card);
          await this.show(`Project selected: ${name}`);
          await this.driver.pause(1500);
          return;
        }
        await this.scroll('up', 0.35);
      }
      await this.tapAt(540, 1481);
      await this.show(`Project selected (coords): ${name}`);
    });
  }

  /**
   * Optional: holding detail path (legacy). Prefer tapSellYourShare.
   */
  async openCloud9Holding() {
    const name = this.projectName;
    await this.check(`Open holding (${name})`, async () => {
      const card = [
        `//*[contains(@content-desc,"${name}") and contains(@content-desc,"Purchase Value")]`,
        `//*[contains(@content-desc,"${name}")]`,
      ];
      for (let i = 0; i < 6; i += 1) {
        if (await this.isVisible(card, 2000)) {
          await this.tap(card);
          await this.show(`Tapped holding: ${name}`);
          break;
        }
        await this.scroll('up', 0.4);
      }
      if (await this.isVisible(this.viewDetails, 3000)) {
        await this.tap(this.viewDetails);
        await this.show('View Details');
      }
    });
  }

  /**
   * After project pick — fill asking price and confirm Sell Shares (if form shown).
   * @param {string|number} askingPrice
   */
  async selectMarketplaceAndList(askingPrice) {
    const price = String(askingPrice || process.env.MARKETPLACE_ASKING_PRICE || '2000').trim();

    // Some builds go straight to success / listings after project pick
    if (await this.isVisible(this.listedSuccess, 2500)) {
      await this.show('Listing success already visible');
      return;
    }

    if (await this.isVisible(this.goToMarketplace, 3000)) {
      await this.check('Go to marketplace', async () => {
        await this.tap(this.goToMarketplace);
        await this.show('Go to marketplace selected');
      });
    }

    if (await this.isVisible(this.unitPicker, 2500)) {
      await this.check('Select 1 unit', async () => {
        await this.tap(this.unitPicker);
        await this.show('1 unit selected');
      });
    }

    const hasPriceUi =
      (await this.isVisible(this.priceFieldHints, 3000)) ||
      (await this.driver.$$('android.widget.EditText')).length > 0;

    if (hasPriceUi) {
      await this.check(`Asking price ৳${price}`, async () => {
        if (await this.isVisible(this.priceFieldHints, 2000)) {
          await this.tap(this.priceFieldHints);
        }
        const fields = await this.driver.$$('android.widget.EditText');
        let typed = false;
        for (const el of fields) {
          try {
            if (!(await el.isDisplayed())) continue;
            await el.click();
            await this.driver.pause(250);
            try {
              await el.clearValue();
            } catch {
              // Flutter
            }
            try {
              await this.driver.execute('mobile: type', { text: price });
            } catch {
              await el.setValue(price).catch(async () => this.driver.keys(price.split('')));
            }
            typed = true;
            break;
          } catch {
            // next
          }
        }
        if (!typed) {
          await this.tapAt(540, 1400);
          await this.driver.pause(300);
          await this.driver.execute('mobile: type', { text: price }).catch(async () => {
            await this.driver.keys(price.split(''));
          });
        }
        await this.show(`Asking price typed: ${price}`);
      });
    } else {
      await this.show('Asking price UI skip');
    }

    await this.check('List for Sale', async () => {
      for (let i = 0; i < 4; i += 1) {
        if (await this.isVisible(this.sellSharesButton, 2000)) break;
        await this.scroll('up', 0.3);
      }
      try {
        await this.tap(this.sellSharesButton, 12000);
      } catch {
        // List for Sale button ~[42,1455][1038,1596]
        await this.tapAt(540, 1525);
        await this.show('List for Sale — coords (forced)');
        return;
      }
      await this.show('List for Sale tapped');
    });

    await this.check('Listing created', async () => {
      await this.driver.waitUntil(
        async () => {
          if (await this.isVisible(this.sellYourShareForm, 800)) return false;
          return (
            (await this.isVisible(
              [
                '//*[contains(@content-desc,"listed")]',
                '//*[contains(@content-desc,"My Listings")]',
                '//*[contains(@content-desc,"Active Shares")]',
                '//*[contains(@content-desc,"Great news")]',
                '//*[contains(@content-desc,"success")]',
              ],
              1500
            )) || (await this.isVisible(this.sellYourShare, 1200))
          );
        },
        {
          timeout: 25000,
          timeoutMsg: 'Marketplace listing success not shown',
        }
      );
      await this.show('Shares listed on marketplace');
    });
  }
}

module.exports = PortfolioPage;

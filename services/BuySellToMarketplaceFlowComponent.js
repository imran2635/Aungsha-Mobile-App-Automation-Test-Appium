const appConfig = require('./AppConfig');
const BaseFlowComponent = require('./BaseFlowComponent');
const BuyFlowComponent = require('./BuyFlowComponent');
const HomePage = require('../pages/HomePage');
const PortfolioPage = require('../pages/PortfolioPage');
const ListingsPage = require('../pages/ListingsPage');

/**
 * Project buy (SurjoPay) → My Portfolio → list on secondary marketplace → My Listings.
 *
 * Mirrors web: marketplace-my-listing-flow (ShurjoPay buy + Sell Shares listing).
 *
 * Usage:
 *   const flow = new BuySellToMarketplaceFlowComponent(driver);
 *   await flow.execute({ buyMethod: 'surjoypay', askingPrice: '2000' });
 */
class BuySellToMarketplaceFlowComponent extends BaseFlowComponent {
  /** @param {WebdriverIO.Browser} driver */
  _bindPages(driver) {
    this.buy = new BuyFlowComponent(driver);
    this.homePage = new HomePage(driver);
    this.portfolioPage = new PortfolioPage(driver);
    this.listingsPage = new ListingsPage(driver);
  }

  /**
   * @param {{
   *   buyMethod?: 'mbanking'|'bkash'|'surjoypay',
   *   skipBuy?: boolean,
   *   askingPrice?: string|number,
   *   referralCode?: string,
   * }} [options]
   */
  async execute(options = {}) {
    const buyMethod = String(
      options.buyMethod || process.env.BUY_METHOD || 'surjoypay'
    ).toLowerCase();
    const skipBuy = options.skipBuy === true || process.env.SKIP_BUY === '1';
    const askingPrice =
      options.askingPrice || process.env.MARKETPLACE_ASKING_PRICE || '2000';
    // Default: no referral on marketplace list flow (explicit '' disables .env REFERRAL_CODE)
    const referralCode =
      options.referralCode !== undefined ? options.referralCode : '';

    try {
      if (!skipBuy) {
        // Docs optional for sell path — success screen is enough to hold units
        if (process.env.SKIP_RECEIPT == null) {
          process.env.SKIP_RECEIPT = '1';
        }
        delete process.env.WALLET_AMOUNT;
        delete process.env.REFERRAL_CODE;

        await this.checkpoint.run(`Project buy (${buyMethod})`, async () => {
          await this.buy.execute(buyMethod, { referralCode });
          this._bind(this.buy.driver);
          await this.recoverSession('[BuySellMarketplace] Recovering after buy…');
        });
      } else {
        await this.checkpoint.run('Skip buy — activate app', async () => {
          try {
            await this.driver.activateApp(appConfig.appPackage);
          } catch {
            await this.recoverSession('[BuySellMarketplace] Recovering session…');
          }
        });
      }

      await this.checkpoint.run('Home before portfolio', () =>
        this.withSessionRetry(() => this.homePage.goHome({ waitShell: true }), {
          label: '[BuySellMarketplace] Recovering before portfolio…',
        })
      );

      await this.checkpoint.run('Portfolio → Sell to Marketplace', () =>
        this.withSessionRetry(
          async () => {
            await this.portfolioPage.openPortfolio();
            await this.portfolioPage.tapSellYourShare();
            await this.portfolioPage.selectProjectToSell();
            await this.portfolioPage.selectMarketplaceAndList(askingPrice);
          },
          { label: '[BuySellMarketplace] Recovering during sell…' }
        )
      );

      await this.checkpoint.run('Verify My Listings', async () => {
        await this.listingsPage.openMyListings();
        await this.listingsPage.expectActiveListing(undefined, askingPrice);
      });

      this.checkpoint.pass('Buy + sell to marketplace DONE');
    } catch (err) {
      this.checkpoint.fail('Buy + sell to marketplace aborted', err);
      throw err;
    }
  }
}

module.exports = BuySellToMarketplaceFlowComponent;

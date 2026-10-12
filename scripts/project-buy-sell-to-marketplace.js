/**
 * Project buy (SurjoPay) → list shares on secondary marketplace → My Listings.
 *
 *   npm.cmd run test:buy:sell:marketplace
 *
 * Env:
 *   MBANKING_NUMBER / MBANKING_PIN  — SurjoPay mBANKING
 *   MARKETPLACE_ASKING_PRICE        — default 2000
 *   BUY_METHOD                      — default surjoypay
 *   SKIP_BUY=1                      — skip buy; list existing holding
 *   SKIP_RECEIPT                    — default 1 for this flow
 *   BUY_PROJECT                     — default Cloud 9 (Inani)
 *   (REFERRAL_CODE cleared — plain buy, no referral apply)
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const BuySellToMarketplaceFlowComponent = require('../services/BuySellToMarketplaceFlowComponent');
const { runStandaloneFlow } = require('../services/runStandaloneFlow');

const raw = (process.argv[2] || process.env.BUY_METHOD || 'surjoypay').toLowerCase();
const aliases = {
  surjoypay: 'surjoypay',
  shurjopay: 'surjoypay',
  surjopay: 'surjoypay',
  mbanking: 'mbanking',
  bkash: 'bkash',
};
const buyMethod = aliases[raw] || 'surjoypay';
process.env.BUY_METHOD = buyMethod;

if (process.env.SKIP_RECEIPT == null) {
  process.env.SKIP_RECEIPT = '1';
}
// Default: always buy unless caller sets SKIP_BUY=1
if (process.env.SKIP_BUY !== '1') {
  process.env.SKIP_BUY = '0';
}
delete process.env.WALLET_AMOUNT;
// This flow: plain SurjoPay buy — never apply referral (even if .env has REFERRAL_CODE)
delete process.env.REFERRAL_CODE;

if (!process.env.MARKETPLACE_ASKING_PRICE) {
  process.env.MARKETPLACE_ASKING_PRICE = '2000';
}

runStandaloneFlow(
  (driver) => new BuySellToMarketplaceFlowComponent(driver),
  [{ buyMethod, askingPrice: process.env.MARKETPLACE_ASKING_PRICE, referralCode: '' }]
).catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Fund-balance project buy — apply wallet/fund credit then pay remainder.
 *
 * Default: WALLET_AMOUNT=500 + SurjoPay/mBANKING (Others → ShurjoPay).
 *
 *   npm.cmd run test:buy:fund:script
 *   node ./scripts/fund-balance-project-buy.js [surjoypay|mbanking|bkash]
 *
 * Env: WALLET_AMOUNT, MBANKING_*, BKASH_*, BUY_METHOD, SKIP_RECEIPT, RESUME_PURCHASE
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

process.env.WALLET_AMOUNT = process.env.WALLET_AMOUNT || '500';

const methodArg = (process.argv[2] || process.env.BUY_METHOD || 'surjoypay').toLowerCase();
const aliases = {
  mbanking: 'mbanking',
  surjoypay: 'surjoypay',
  shurjopay: 'surjoypay',
  surjopay: 'surjoypay',
  bkash: 'bkash',
};
const paymentMethod = aliases[methodArg] || 'surjoypay';

process.argv[2] = paymentMethod;
require('./run-pom-buy.js');

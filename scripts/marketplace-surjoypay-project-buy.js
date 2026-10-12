/**
 * Marketplace → Cloud 9 project buy via SurjoPay (ShurjoPay → mBANKING)
 * then download Invoice + Ownership Certificate (receipt/share cert UI).
 *
 *   npm.cmd run test:buy:marketplace:surjoypay
 *
 * Env: MBANKING_NUMBER, MBANKING_PIN, SKIP_RECEIPT (do not set — docs required)
 * Optional: BUY_PROJECT (default Cloud 9 (Inani))
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Full SurjoPay path — no wallet (marketplace project buy)
delete process.env.WALLET_AMOUNT;
process.env.SKIP_RECEIPT = process.env.SKIP_RECEIPT || '0';
if (process.env.SKIP_RECEIPT === '1') {
  console.warn('[marketplace-surjoypay] SKIP_RECEIPT=1 — Invoice/Certificate will be skipped');
}

process.argv[2] = 'surjoypay';
require('./run-pom-buy.js');

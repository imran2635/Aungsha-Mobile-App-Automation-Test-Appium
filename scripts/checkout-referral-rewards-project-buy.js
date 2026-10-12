/**
 * Checkout page — apply referral rewards code, then Marketplace SurjoPay project buy.
 *
 * Default code: D5A0D3B4
 *
 *   npm.cmd run test:buy:referral
 *
 * Env: REFERRAL_CODE, MBANKING_NUMBER, MBANKING_PIN, BUY_METHOD (default surjoypay)
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

process.env.REFERRAL_CODE = process.env.REFERRAL_CODE || 'D5A0D3B4';
delete process.env.WALLET_AMOUNT;
process.env.SKIP_RECEIPT = process.env.SKIP_RECEIPT || '0';

const method = (process.argv[2] || process.env.BUY_METHOD || 'surjoypay').toLowerCase();
process.argv[2] = method === 'mbanking' ? 'mbanking' : method === 'bkash' ? 'bkash' : 'surjoypay';

console.log(`[checkout-referral] code=${process.env.REFERRAL_CODE} method=${process.argv[2]}`);
require('./run-pom-buy.js');

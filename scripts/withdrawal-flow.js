/**
 * Withdrawal flow CLI — optional buy → Home → Fund → Withdraw (bKash).
 *
 * Env: BUY_METHOD, SKIP_BUY, SKIP_RECEIPT, WITHDRAW_*, MBANKING_*, BKASH_*
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const WithdrawFlowComponent = require('../src/components/WithdrawFlowComponent');
const { runStandaloneFlow } = require('../src/core/runStandaloneFlow');

runStandaloneFlow((driver) => new WithdrawFlowComponent(driver)).catch((err) => {
  console.error(err);
  process.exit(1);
});

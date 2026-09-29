/**
 * Withdrawal flow CLI — optional buy → Home → Fund → Withdraw (bKash) ৳500.
 *
 *   node scripts/withdrawal-flow.js
 *
 * Env:
 *   BUY_METHOD=surjoypay|mbanking|bkash
 *   SKIP_BUY=1
 *   SKIP_RECEIPT=1   (buy success only — keeps session for withdraw)
 *   WITHDRAW_BKASH_NUMBER=01772559986
 *   WITHDRAW_AMOUNT=500
 *   MBANKING_* / BKASH_* (for buy step)
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SessionFactory = require('../src/core/SessionFactory');
const DriverManager = require('../src/core/DriverManager');
const WithdrawFlowComponent = require('../src/components/WithdrawFlowComponent');

(async () => {
  let driver = await SessionFactory.createStandalone();
  DriverManager.setDriver(driver);
  const flow = new WithdrawFlowComponent(driver);

  try {
    await flow.execute();
  } finally {
    driver = flow.driver || driver;
    try {
      await driver.switchContext('NATIVE_APP');
    } catch {
      // ignore
    }
    try {
      await driver.deleteSession();
    } catch {
      // ignore
    }
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

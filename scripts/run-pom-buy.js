/**
 * CLI — runs single OOP BuyFlowComponent (POM).
 *   node scripts/run-pom-buy.js mbanking
 *   node scripts/run-pom-buy.js bkash
 *   node scripts/run-pom-buy.js surjoypay
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SessionFactory = require('../src/core/SessionFactory');
const DriverManager = require('../src/core/DriverManager');
const BuyFlowComponent = require('../src/components/BuyFlowComponent');

const raw = (process.argv[2] || 'mbanking').toLowerCase();
const aliases = {
  mbanking: 'mbanking',
  bkash: 'bkash',
  surjoypay: 'surjoypay',
  shurjopay: 'surjoypay',
  surjopay: 'surjoypay',
};
const paymentMethod = aliases[raw];

(async () => {
  if (!paymentMethod) {
    console.error('Usage: node scripts/run-pom-buy.js [mbanking|bkash|surjoypay]');
    process.exit(2);
  }

  let driver = await SessionFactory.createStandalone();
  DriverManager.setDriver(driver);
  const buy = new BuyFlowComponent(driver);

  try {
    await buy.execute(paymentMethod);
  } finally {
    driver = buy.driver || driver;
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

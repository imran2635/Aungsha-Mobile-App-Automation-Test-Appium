/**
 * CLI — OOP BuyFlowComponent (POM).
 *   node scripts/run-pom-buy.js mbanking|bkash|surjoypay
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const BuyFlowComponent = require('../src/components/BuyFlowComponent');
const { runStandaloneFlow } = require('../src/core/runStandaloneFlow');

const raw = (process.argv[2] || 'mbanking').toLowerCase();
const aliases = {
  mbanking: 'mbanking',
  bkash: 'bkash',
  surjoypay: 'surjoypay',
  shurjopay: 'surjoypay',
  surjopay: 'surjoypay',
};
const paymentMethod = aliases[raw];

if (!paymentMethod) {
  console.error('Usage: node scripts/run-pom-buy.js [mbanking|bkash|surjoypay]');
  process.exit(2);
}

runStandaloneFlow((driver) => new BuyFlowComponent(driver), [paymentMethod]).catch((err) => {
  console.error(err);
  process.exit(1);
});

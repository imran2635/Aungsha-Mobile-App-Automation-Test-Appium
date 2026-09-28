/** Fund-balance / project buy via bKash — OOP BuyFlowComponent (SurjoPay script format) */
process.env.WALLET_AMOUNT = process.env.WALLET_AMOUNT || '500';
process.argv[2] = 'bkash';
require('./run-pom-buy.js');

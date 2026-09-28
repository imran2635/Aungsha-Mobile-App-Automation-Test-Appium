/** Fund-balance / project buy via SurjoPay (ShurjoPay → mBANKING) — OOP BuyFlowComponent */
process.env.WALLET_AMOUNT = process.env.WALLET_AMOUNT || '500';
process.argv[2] = 'surjoypay';
require('./run-pom-buy.js');

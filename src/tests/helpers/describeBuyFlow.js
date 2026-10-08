const appConfig = require('../config/AppConfig');
const DriverManager = require('../core/DriverManager');
const checkpoint = require('../core/Checkpoint');
const BuyFlowComponent = require('../components/BuyFlowComponent');

/**
 * Shared WDIO buy-spec helper — credentials + execute with checkpoints.
 * @param {'mbanking'|'bkash'|'surjoypay'} method
 * @param {string} title
 */
function describeBuyFlow(method, title) {
  describe(title, () => {
    /** @type {BuyFlowComponent} */
    let buy;

    before(async () => {
      checkpoint.reset();
      await checkpoint.run('Bind driver', async () => {
        DriverManager.setDriver(browser);
        buy = new BuyFlowComponent(browser);
      });
    });

    after(() => {
      checkpoint.summary();
    });

    it(`should buy Cloud 9 via ${method}`, async () => {
      await checkpoint.run('Credentials present', async () => {
        const { email, password } = appConfig.getCredentials();
        expect(email).toBeTruthy();
        expect(password).toBeTruthy();

        if (method === 'bkash') {
          const bkash = appConfig.getBkashCredentials();
          expect(bkash.number).toBeTruthy();
          expect(bkash.otp).toBeTruthy();
          expect(bkash.pin).toBeTruthy();
        } else {
          const mbanking = appConfig.getMBankingCredentials();
          expect(mbanking.number).toBeTruthy();
          expect(mbanking.pin).toBeTruthy();
        }
      });

      await buy.execute(method);
    });
  });
}

module.exports = { describeBuyFlow };

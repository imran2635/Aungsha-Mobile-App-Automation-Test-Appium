const appConfig = require('../config/AppConfig');
const DriverManager = require('../core/DriverManager');
const BuyFlowComponent = require('../components/BuyFlowComponent');

/**
 * TC-BUY-02 — Cloud 9 buy via bKash (POM + OOP component).
 */
describe('Aungsha Buy Flow — bKash', () => {
  /** @type {BuyFlowComponent} */
  let buy;

  before(async () => {
    DriverManager.setDriver(browser);
    buy = new BuyFlowComponent(browser);
  });

  it('should buy Cloud 9 via bKash', async () => {
    const { email, password } = appConfig.getCredentials();
    const bkash = appConfig.getBkashCredentials();
    expect(email).toBeTruthy();
    expect(password).toBeTruthy();
    expect(bkash.number).toBeTruthy();
    expect(bkash.otp).toBeTruthy();
    expect(bkash.pin).toBeTruthy();

    await buy.execute('bkash');
  });
});

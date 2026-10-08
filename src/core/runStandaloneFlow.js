const DriverManager = require('../core/DriverManager');
const SessionFactory = require('../core/SessionFactory');
const checkpoint = require('./Checkpoint');

/**
 * Run a flow component with a standalone Appium session (CLI).
 * Shared by buy / withdraw scripts — no duplicated session bootstrap.
 *
 * @param {(driver: WebdriverIO.Browser) => { driver: WebdriverIO.Browser, execute: Function }} createFlow
 * @param {unknown[]} [executeArgs]
 */
async function runStandaloneFlow(createFlow, executeArgs = []) {
  checkpoint.reset();
  let driver;
  await checkpoint.run('Create Appium session', async () => {
    driver = await SessionFactory.createStandalone();
    DriverManager.setDriver(driver);
  });
  const flow = createFlow(driver);

  try {
    await flow.execute(...executeArgs);
  } finally {
    checkpoint.summary();
    driver = flow.driver || driver;
    await SessionFactory.quitQuietly(driver);
  }
}

module.exports = { runStandaloneFlow };

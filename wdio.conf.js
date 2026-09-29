const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const appConfig = require('./src/config/AppConfig');

exports.config = {
  runner: 'local',
  hostname: appConfig.appiumHost,
  port: appConfig.appiumPort,
  path: '/',
  specs: ['./src/tests/**/*.test.js'],
  exclude: [],
  maxInstances: 1,
  capabilities: [appConfig.getCapabilities()],
  logLevel: 'warn',
  bail: 0,
  waitforTimeout: 12000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 2,
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 600000,
  },
  services:
    process.env.START_APPIUM === '1'
      ? [
          [
            'appium',
            {
              args: {
                address: appConfig.appiumHost,
                port: appConfig.appiumPort,
                relaxedSecurity: true,
              },
              command: 'appium',
            },
          ],
        ]
      : [],
  before: async () => {
    const fs = require('fs');
    const path = require('path');
    const dir = path.join(process.cwd(), 'artifacts', 'screenshots');
    fs.mkdirSync(dir, { recursive: true });
  },
  onComplete(exitCode) {
    const line = '='.repeat(56);
    if (exitCode === 0) {
      console.log(`\n${line}`);
      console.log('  RESULT: PASSED');
      console.log(`${line}\n`);
    } else {
      console.log(`\n${line}`);
      console.log('  RESULT: FAILED');
      console.log(`  exit code: ${exitCode}`);
      console.log(`${line}\n`);
    }
  },
};

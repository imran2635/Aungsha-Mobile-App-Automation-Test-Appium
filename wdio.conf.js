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
    if (!fs.existsSync('./screenshots')) {
      fs.mkdirSync('./screenshots');
    }
  },
};

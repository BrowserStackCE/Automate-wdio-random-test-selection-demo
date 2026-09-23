// wdio.preferred.conf.js
//
// Run Mode 2: Device 1 Preferred — single wdio process, two capabilities.
//
// The orchestrator (run-tests.js) resolves the spec list, applies the
// Device 1 priority assignment, then passes the two spec arrays via
// environment variables (DEVICE1_SPECS / DEVICE2_SPECS as JSON arrays).
//
// A single wdio process with both capabilities means BrowserStack sees
// one build — no race condition, no duplicate builds.
//
// Do NOT run this directly — use: npm run test:preferred [-- --suite=<name>]

const buildName = process.env.BROWSERSTACK_BUILD_NAME || 'WDIO-Preferred';

const device1Specs = JSON.parse(process.env.DEVICE1_SPECS || '[]');
const device2Specs = JSON.parse(process.env.DEVICE2_SPECS || '[]');

exports.config = {
  user: process.env.BROWSERSTACK_USERNAME,
  key: process.env.BROWSERSTACK_ACCESS_KEY,
  hostname: 'hub.browserstack.com',

  // Root specs list required by WDIO to initialise workers
  specs: [...device1Specs, ...device2Specs],

  services: [
    ['browserstack', {
      browserstackLocal: false,
      testObservability: true,
      testObservabilityOptions: {
        projectName: 'wdio random test selection updated',
        buildName
      }
    }]
  ],

  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000
  },

  logLevel: 'info',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  capabilities: [
    {
      // Device 1 (priority) — Samsung Galaxy S23, up to 5 parallel
      browserName: 'chrome',
      'bstack:options': {
        deviceName: 'Samsung Galaxy S23',
        osVersion: '13.0',
        projectName: 'wdio random test selection updated',
        buildName,
        sessionName: 'Device 1 (priority) run',
        debug: true,
        networkLogs: true
      },
      'wdio:maxInstances': 5,
      specs: device1Specs
    },
    {
      // Device 2 (overflow) — iPhone 14, up to 5 parallel
      browserName: 'safari',
      'bstack:options': {
        deviceName: 'iPhone 14',
        osVersion: '16',
        projectName: 'wdio random test selection updated',
        buildName,
        sessionName: 'Device 2 (overflow) run',
        debug: true,
        networkLogs: true
      },
      'wdio:maxInstances': 5,
      specs: device2Specs
    }
  ]
};

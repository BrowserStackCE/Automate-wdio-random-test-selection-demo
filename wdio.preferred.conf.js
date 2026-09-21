// wdio.preferred.conf.js
//
// Used only by run-tests.js (the "device 1 preferred, device 2 overflow"
// orchestrator). Each invocation targets exactly ONE device and ONE spec,
// chosen by the orchestrator via the TARGET_DEVICE env var. Not meant to
// be run directly with `wdio run` for the full suite -- use `npm run
// test:preferred` instead.

const DEVICES = {
  '1': { deviceName: 'Samsung Galaxy S23', osVersion: '13.0', browserName: 'chrome' },
  '2': { deviceName: 'iPhone 14', osVersion: '16', browserName: 'safari' }
};

const device = DEVICES[process.env.TARGET_DEVICE || '1'];

exports.config = {
  user: process.env.BROWSERSTACK_USERNAME,
  key: process.env.BROWSERSTACK_ACCESS_KEY,
  hostname: 'hub.browserstack.com',

  services: [
    ['browserstack', {
      browserstackLocal: false,
      testObservability: true,
      testObservabilityOptions: {
        projectName: 'wdio random test selection updated',
        buildName: process.env.BROWSERSTACK_BUILD_NAME || 'WDIO-Sample-Preferred'
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
  maxInstances: 1, // the orchestrator controls concurrency, not wdio

  capabilities: [
    {
      browserName: device.browserName,
      'bstack:options': {
        deviceName: device.deviceName,
        osVersion: device.osVersion,
        projectName: 'wdio random test selection updated',
        buildName: process.env.BROWSERSTACK_BUILD_NAME || 'WDIO-Sample-Preferred',
        sessionName: `Device ${process.env.TARGET_DEVICE || '1'} run`
      }
    }
  ]
};

// wdio.conf.js
//
// Runs specs based on the selected SUITE, split randomly 5/5 across two BrowserStack devices,
// with each device allowed up to 5 parallel sessions -> 10 sessions running
// at once in total.
//
// Re-run the suite and check the console output: the split is
// re-shuffled every time this config loads.

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Define your test suites here (must match run-tests.js)
const suites = {
  A: ['test/suites/suite-a/**/*.js'],
  B: ['test/suites/suite-b/**/*.js'],
  C: ['test/suites/suite-c/**/*.js'],
  priorityFt: [
    'tests/ui/e2e/patient_onboarding/query-param-cookies*.js',
    'tests/ui/e2e/patient_onboarding/generated_tests/*-st.spec.js'
  ],
  default: ['test/specs/**/*.js'] // Fallback to all specs
};

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function findSpecs(suiteName) {
  const patterns = suites[suiteName] || suites.default;
  let results = [];
  patterns.forEach(pattern => {
    results = results.concat(glob.sync(pattern, { absolute: true }));
  });
  return [...new Set(results)]; // Return unique files
}

const targetSuite = process.env.SUITE || 'default';
const allSpecs = shuffle(findSpecs(targetSuite));
const mid = Math.ceil(allSpecs.length / 2);
const device1Specs = allSpecs.slice(0, mid);
const device2Specs = allSpecs.slice(mid);

console.log(`\nTargeting Suite: ${targetSuite}`);
console.log(`Total specs found: ${allSpecs.length}`);
console.log(`Device 1 (Samsung Galaxy S23) -> ${device1Specs.length} spec(s):`, device1Specs);
console.log(`Device 2 (iPhone 14)         -> ${device2Specs.length} spec(s):`, device2Specs, '\n');

const buildName = `WDIO-Sample-${new Date().toISOString().slice(0, 16).replace(':', '-')}`;

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

  // Sum of both devices' maxInstances below, so all 10 sessions can run at once.
  maxInstances: 10,

  capabilities: [
    {
      // Device 1 -- up to 5 sessions in parallel
      browserName: 'chrome',
      'bstack:options': {
        deviceName: 'Samsung Galaxy S23',
        osVersion: '13.0',
        projectName: 'wdio random test selection updated',
        buildName,
        sessionName: `Device 1 run - ${targetSuite}`,
        debug: true,
        networkLogs: true
      },
      'wdio:maxInstances': 5,
      specs: device1Specs
    },
    {
      // Device 2 -- up to 5 sessions in parallel
      browserName: 'safari',
      'bstack:options': {
        deviceName: 'iPhone 14',
        osVersion: '16',
        projectName: 'wdio random test selection updated',
        buildName,
        sessionName: `Device 2 run - ${targetSuite}`,
        debug: true,
        networkLogs: true
      },
      'wdio:maxInstances': 5,
      specs: device2Specs
    }
  ]
};
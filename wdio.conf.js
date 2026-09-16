// wdio.conf.js
//
// Runs 10 specs total, split randomly 5/5 across two BrowserStack devices,
// with each device allowed up to 5 parallel sessions -> 10 sessions running
// at once in total.
//
// Re-run the suite and check the console output: the 5/5 split is
// re-shuffled every time this config loads.

import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function findSpecs(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findSpecs(full));
    } else if (entry.name.endsWith('.js')) {
      results.push(full);
    }
  }
  return results;
}

const specDir = path.join(__dirname, 'test', 'specs');
const allSpecs = shuffle(findSpecs(specDir));
const mid = Math.ceil(allSpecs.length / 2);
const device1Specs = allSpecs.slice(0, mid);
const device2Specs = allSpecs.slice(mid);

console.log(`\nTotal specs found: ${allSpecs.length}`);
console.log(`Device 1 (Samsung Galaxy S23) -> ${device1Specs.length} spec(s):`, device1Specs);
console.log(`Device 2 (iPhone 14)         -> ${device2Specs.length} spec(s):`, device2Specs, '\n');

const buildName = `WDIO-Sample-${new Date().toISOString().slice(0, 16).replace(':', '-')}`;

export const config = {
  user: process.env.BROWSERSTACK_USERNAME,
  key: process.env.BROWSERSTACK_ACCESS_KEY,
  hostname: 'hub.browserstack.com',

  services: [
    ['browserstack', {
      browserstackLocal: false
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
      specs: device1Specs,
      'bstack:options': {
        deviceName: 'Samsung Galaxy S23',
        osVersion: '13.0',
        projectName: 'WDIO BrowserStack Sample',
        buildName,
        sessionName: 'Device 1 run',
        debug: true,
        networkLogs: true
      }
    },
    {
      // Device 2 -- up to 5 sessions in parallel
      browserName: 'safari',
      specs: device2Specs,
      'bstack:options': {
        deviceName: 'iPhone 14',
        osVersion: '16',
        projectName: 'WDIO BrowserStack Sample',
        buildName,
        sessionName: 'Device 2 run',
        debug: true,
        networkLogs: true
      }
    }
  ]
};

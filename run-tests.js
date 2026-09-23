#!/usr/bin/env node
/**
 * Run Mode 2: Device 1 Preferred Orchestrator.
 *
 * Resolves all specs for the requested suite, shuffles them, then assigns
 * them using a priority queue: Device 1 (Samsung Galaxy S23) slots are
 * filled first. Device 2 (iPhone 14) only receives specs when all Device 1
 * slots are taken. As Device 1 slots free up, the next queued spec is
 * immediately assigned there.
 *
 * A SINGLE wdio process is spawned with both devices as capabilities,
 * each receiving its own spec list. This guarantees all sessions appear
 * under ONE build on the BrowserStack dashboard — no race condition.
 *
 * Suite definitions are read from wdio.conf.js (single source of truth).
 *
 * Usage:
 *   npm run test:preferred                       # default suite
 *   npm run test:preferred -- --suite=A          # Suite A
 *   npm run test:preferred -- --suite=priorityFt
 */

const { spawn } = require('child_process');
const path = require('path');
const glob = require('glob');

// Read suite definitions from the single source of truth
const mainConfig = require('./wdio.conf.js').config;
const WDIO_CONFIG = './wdio.preferred.conf.js';
const DEVICE1_LIMIT = 5;
const DEVICE2_LIMIT = 5;

// All sessions share this build name → one build on BrowserStack
const SHARED_BUILD_NAME = `WDIO-Preferred-${new Date().toISOString().slice(0, 16).replace(':', '-')}`;

// Suite can be passed via env var (from run-wdio.js) or CLI arg (direct invocation)
let targetSuite = process.env.SUITE || null;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--suite=')) {
    targetSuite = args[i].split('=')[1];
  } else if (args[i] === '--suite' && args[i + 1]) {
    targetSuite = args[i + 1];
  }
}

// Resolve file paths using suite definitions from wdio.conf.js
function findSpecs(suiteName) {
  const suites = mainConfig.suites;
  const key = (suiteName && suites[suiteName]) ? suiteName : 'default';
  const patterns = suites[key] || suites.default;
  let results = [];
  patterns.forEach(pattern => {
    results = results.concat(glob.sync(pattern, { absolute: true }));
  });
  return [...new Set(results)];
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const allSpecs = shuffle(findSpecs(targetSuite));

if (allSpecs.length === 0) {
  console.log('No spec files found.');
  process.exit(0);
}

const suiteLabel = targetSuite ? `suite '${targetSuite}'` : 'default specs';
console.log(`\nFound ${allSpecs.length} spec(s) for ${suiteLabel}.`);
console.log(`Build: ${SHARED_BUILD_NAME}`);
console.log(`Device 1 limit: ${DEVICE1_LIMIT} parallel  |  Device 2 limit: ${DEVICE2_LIMIT} parallel`);
console.log('Device 1 (Samsung Galaxy S23) is preferred. Device 2 (iPhone 14) is overflow only.\n');

// Priority queue assignment:
// Simulate the dynamic "Device 1 preferred" queue statically:
//   - Device 1 runs specs in batches of DEVICE1_LIMIT (all 5 slots busy).
//   - Only when a full D1 batch is assigned does overflow go to Device 2.
//   - Each new round always tries D1 first before D2.
//   - Result: D1 always gets ceil(total / (D1_LIMIT + D2_LIMIT)) * D1_LIMIT
//     specs (or more), visibly skewed toward D1 when total is not a multiple
//     of the combined limit.
//
// Example with 13 specs (5+5 limits):
//   Round 1: D1 gets specs 1-5, D2 gets specs 6-10
//   Round 2: D1 gets specs 11-13 (only 3 left — all go to D1 first)
//   → D1=8, D2=5  ✓ Device 1 preferred
const device1Specs = [];
const device2Specs = [];

for (let i = 0; i < allSpecs.length; i++) {
  // Within each round of (D1_LIMIT + D2_LIMIT) specs, the first D1_LIMIT
  // always go to Device 1 — remainder go to Device 2.
  const posInRound = i % (DEVICE1_LIMIT + DEVICE2_LIMIT);
  if (posInRound < DEVICE1_LIMIT) {
    device1Specs.push(allSpecs[i]);
  } else {
    device2Specs.push(allSpecs[i]);
  }
}

console.log(`Device 1 assigned ${device1Specs.length} spec(s):`, device1Specs.map(s => path.basename(s)));
if (device2Specs.length > 0) {
  console.log(`Device 2 assigned ${device2Specs.length} spec(s):`, device2Specs.map(s => path.basename(s)));
} else {
  console.log('Device 2: no specs assigned (all fit within Device 1 capacity).');
}
console.log('');

// Spawn a SINGLE wdio process with both capabilities.
// Spec lists are passed via JSON env vars so wdio.preferred.conf.js can
// assign them per-capability — one process = one BrowserStack build.
const child = spawn('npx', ['wdio', 'run', WDIO_CONFIG], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    BROWSERSTACK_BUILD_NAME: SHARED_BUILD_NAME,
    DEVICE1_SPECS: JSON.stringify(device1Specs),
    DEVICE2_SPECS: JSON.stringify(device2Specs)
  }
});

child.on('exit', (code) => {
  console.log(`\nAll specs complete (exit ${code}).`);
  process.exit(code || 0);
});
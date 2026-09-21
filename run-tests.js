#!/usr/bin/env node
/**
 * Optional alternate run mode: dispatches specs from a single shared
 * queue, preferring device 1 and only overflowing to device 2 once
 * device 1 has no free parallel slot. Every spec runs exactly once.
 *
 * Usage:
 *   npm run test:preferred
 *
 * Uses wdio.preferred.conf.js, which picks a single device per
 * invocation via the TARGET_DEVICE env var this script sets.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ---- CONFIG ----
const SPEC_DIR = path.join(__dirname, 'test', 'specs');
const WDIO_CONFIG = './wdio.preferred.conf.js';
const DEVICE_LIMITS = { '1': 5, '2': 5 }; // max parallel sessions per device
// -----------------

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

const queue = findSpecs(SPEC_DIR);
const running = { '1': 0, '2': 0 };
let inFlight = 0;
let hadFailure = false;

if (queue.length === 0) {
  console.log(`No spec files found in ${SPEC_DIR}`);
  process.exit(0);
}

console.log(`Found ${queue.length} spec(s). Preferring device 1, overflow to device 2.\n`);

function pickDevice() {
  if (running['1'] < DEVICE_LIMITS['1']) return '1';
  if (running['2'] < DEVICE_LIMITS['2']) return '2';
  return null; // both full -- wait for something to finish
}

function dispatch() {
  while (queue.length > 0) {
    const device = pickDevice();
    if (!device) break;

    const spec = queue.shift();
    running[device]++;
    inFlight++;
    console.log(`-> ${spec} => device ${device}  (running: d1=${running['1']}, d2=${running['2']}, queued=${queue.length})`);

    const child = spawn('npx', ['wdio', 'run', WDIO_CONFIG, '--spec', spec], {
      stdio: 'inherit',
      shell: true, // needed for npx to resolve correctly on Windows
      env: { ...process.env, TARGET_DEVICE: device }
    });

    child.on('exit', (code) => {
      running[device]--;
      inFlight--;
      if (code !== 0) hadFailure = true;
      console.log(`<- ${spec} finished on device ${device} (exit ${code})`);

      dispatch(); // immediately try to refill the slot that just freed

      if (inFlight === 0 && queue.length === 0) {
        console.log('\nAll specs complete.');
        process.exit(hadFailure ? 1 : 0);
      }
    });
  }
}

dispatch();

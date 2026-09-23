#!/usr/bin/env node
/**
 * Wrapper for both run modes.
 *
 * Parses --suite=<name> from argv and sets SUITE env var before spawning
 * the appropriate runner. This avoids WDIO intercepting --suite as its own
 * native flag.
 *
 * Mode 1 (even split):      npm test [-- --suite=<name>]
 *   → spawns: npx wdio run ./wdio.conf.js
 *
 * Mode 2 (device 1 preferred): npm run test:preferred [-- --suite=<name>]
 *   → spawns: node run-tests.js [--suite=<name>]
 */

const { spawn } = require('child_process');

let suite = null;
let preferred = false;

const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--suite=')) {
    suite = args[i].split('=')[1];
  } else if (args[i] === '--suite' && args[i + 1]) {
    suite = args[i + 1];
  } else if (args[i] === '--preferred') {
    preferred = true;
  }
}

const env = { ...process.env };
if (suite) env.SUITE = suite;

let child;
if (preferred) {
  // Mode 2: always delegate to run-tests.js so the dynamic Device 1 priority
  // queue is used. Pass suite via env var (SUITE) — never spawn wdio directly
  // here, as that would bypass the orchestrator.
  child = spawn('node', ['run-tests.js'], { stdio: 'inherit', shell: true, env });
} else {
  // Mode 1: set SUITE env var and spawn wdio directly
  child = spawn('npx', ['wdio', 'run', './wdio.conf.js'], { stdio: 'inherit', shell: true, env });
}

child.on('exit', (code) => process.exit(code || 0));

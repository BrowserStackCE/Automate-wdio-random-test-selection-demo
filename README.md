# WDIO + BrowserStack: Randomized Parallel Tests Across 2 Devices

A WebdriverIO project demonstrating randomized test distribution across two BrowserStack devices, with dynamic suite selection and two selectable run modes.

This project uses **CommonJS** (`require`/`module.exports`) throughout —
there is no `"type": "module"` in `package.json`, so it works with plain
`node`/`wdio` invocations without any ESM-related warnings.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and add your BrowserStack username + access key
```

## Run Mode 1: Even Parallel Split

Resolves all spec files for the requested suite, shuffles them with a
Fisher-Yates algorithm, and splits them **5/5** across two devices
(Samsung Galaxy S23 on Chrome, iPhone 14 on Safari) — all sessions
run concurrently under **one build**.

```bash
# Run the default suite (test/specs/**/*.js)
npm test

# Run a specific named suite
npm test -- --suite=A
npm test -- --suite=B
npm test -- --suite=C
npm test -- --suite=priorityFt
```

## Run Mode 2: Device 1 Preferred

Resolves all spec files for the requested suite, shuffles them, then assigns
them using a **Device 1 priority queue**:

- Device 1 (Samsung Galaxy S23) slots are filled **first** in every round.
- Device 2 (iPhone 14) only receives specs when all Device 1 slots are taken.
- Any "remainder" specs always go to Device 1 — never Device 2.
- A **single wdio process** is spawned with both devices as capabilities,
  so all sessions appear under **one build** on the BrowserStack dashboard.

### Priority skew examples (Device 1 limit = 5, Device 2 limit = 5)

| Total specs | Device 1 | Device 2 | Notes |
|-------------|----------|----------|-------|
| 3           | 3        | 0        | All fit in D1 |
| 7           | 5        | 2        | D1 full first round, D2 gets remainder |
| 10          | 5        | 5        | One full round each |
| 13          | 8        | 5        | D1 gets extra round remainder |
| 20          | 10       | 10       | Two full rounds each |

```bash
# Run the default suite
npm run test:preferred

# Run a specific named suite
npm run test:preferred -- --suite=A
npm run test:preferred -- --suite=B   # 13 specs — shows Device 1 preference skew (D1=8, D2=5)
npm run test:preferred -- --suite=C
npm run test:preferred -- --suite=priorityFt
```

## Suite Definitions

All suites are defined in **one place** — `wdio.conf.js` at the project root.
`run-tests.js` reads them via `require('./wdio.conf.js').config.suites` —
no separate file required.

```js
// inside wdio.conf.js → exports.config.suites
const suites = {
  A:          ['test/suites/suite-a/**/*.js'],          // 20 specs
  B:          ['test/suites/suite-b/**/*.js'],          // 13 specs — shows D1 preference (D1=8, D2=5)
  C:          ['test/suites/suite-c/**/*.js'],          // 10 specs
  priorityFt: [
    'tests/ui/e2e/patient_onboarding/query-param-cookies*.js',
    'tests/ui/e2e/patient_onboarding/generated_tests/*-st.spec.js'
  ],
  default:    ['test/specs/**/*.js']                    // 10 specs
};
```

To add a new suite, add one entry to the `suites` object in `wdio.conf.js` — no other file needs changing.

## Project Structure

```
wdio-browserstack-randomtest-commonjs/
├── package.json
├── wdio.conf.js              # Single source of truth: suite defs + run mode 1 (even split)
├── wdio.preferred.conf.js    # Single-process config for run mode 2 (D1 priority, both devices)
├── run-wdio.js               # CLI interceptor: routes --preferred to run-tests.js
├── run-tests.js              # Priority queue orchestrator: assigns specs to devices
├── .env.example
└── test/
    ├── specs/                # Default suite (test1.js … test10.js)
    └── suites/
        ├── suite-a/          # Suite A (suite-a-test1.js … suite-a-test20.js)
        ├── suite-b/          # Suite B (suite-b-test1.js … suite-b-test13.js) — 13 specs, D1 preference demo
        └── suite-c/          # Suite C (suite-c-test1.js … suite-c-test10.js)
```

## How It Works

### CLI Argument Parsing

`run-wdio.js` parses `--suite=<name>` and `--preferred` from `process.argv`.
The suite name is forwarded as the `SUITE` environment variable. For Mode 1
it spawns `wdio` directly; for Mode 2 it always delegates to `node run-tests.js`
so the Device 1 priority assignment is applied — wdio is never spawned directly
in preferred mode, as that would bypass the orchestrator.

This approach avoids WDIO 9 intercepting `--suite` as its own native flag.

### Single Build per Run

Both modes spawn a **single `wdio` process** — all sessions appear under one build.

**Mode 2** passes the two spec lists to `wdio.preferred.conf.js` via
`DEVICE1_SPECS` and `DEVICE2_SPECS` JSON environment variables, and injects
`BROWSERSTACK_BUILD_NAME` so both capability blocks share the same build name.
One process = one build on the BrowserStack dashboard, no race condition.

### Device 1 Priority Assignment

`run-tests.js` walks the shuffled spec list and assigns specs round-by-round:
the first `DEVICE1_LIMIT` specs in each round go to Device 1, the next
`DEVICE2_LIMIT` go to Device 2. Any remainder at the end of the last round
always goes to Device 1 — so Device 1 is always preferred.

### Randomization

Both modes apply a Fisher-Yates shuffle to the fully resolved glob file
list before any assignment. Re-run the same command and the device split
changes every time.

### Fallback

If `--suite` is omitted or the name doesn't match a key in `wdio.conf.js`,
both modes fall back to `default` (`test/specs/**/*.js`).

## Notes

- The sample specs hit BrowserStack's public demo app
  (https://bstackdemo.com/) — no app of your own required. Replace the
  spec files with your real tests.
- To scale beyond 5 parallel sessions per device, bump `wdio:maxInstances`
  in `wdio.conf.js` and `DEVICE1_LIMIT`/`DEVICE2_LIMIT` in `run-tests.js`.
- To add a third device, add another capability block to `wdio.preferred.conf.js`,
  extend the assignment logic in `run-tests.js`, and add the capability to
  `wdio.conf.js` for Mode 1.
- The `glob` package resolves wildcard suite patterns and is listed under
  `dependencies` in `package.json` — installed automatically via `npm install`.

---

## Changelog

### Refactor: Single Source of Truth + Device 1 Preferred Mode

The following changes were made to fix `npm run test:preferred` and ensure
all sessions group under one BrowserStack build:

#### `suites.js` — **deleted**
Removed the external suite definitions file. All suite patterns now live
directly in `wdio.conf.js` under `exports.config.suites`, eliminating a
separate file and making `wdio.conf.js` the single source of truth.

#### `wdio.conf.js` — **updated**
- Moved the `suites` object inline (previously in `suites.js`).
- Exposed it via `exports.config.suites` so `run-tests.js` can read it
  with `require('./wdio.conf.js').config.suites` — no duplication.
- Added Suite A (20 specs), expanded Suite B to 13 specs (Device 1
  preference demo), kept Suite C at 10 specs.
- Remains the primary config for Mode 1 (even 5/5 split).

#### `run-wdio.js` — **updated**
- Fixed the `--preferred` routing: now always delegates to
  `node run-tests.js` via the `SUITE` environment variable.
- Previously it could spawn `wdio` directly for preferred mode, bypassing
  the orchestrator and breaking the priority queue.

#### `run-tests.js` — **refactored**
- Reads suite definitions from `wdio.conf.js` (single source of truth).
- Generates one `SHARED_BUILD_NAME` timestamp at startup.
- **Single wdio process**: passes both spec lists to `wdio.preferred.conf.js`
  via `DEVICE1_SPECS` / `DEVICE2_SPECS` JSON env vars — one process means
  one BrowserStack build, no race condition.
- Priority queue assignment: Device 1 slots fill first in every round;
  any remainder always goes to Device 1 (never Device 2).
- Retains Fisher-Yates shuffle for randomized spec order each run.

#### `wdio.preferred.conf.js` — **refactored**
- Removed all static array slicing, shuffling, and glob resolution.
- Now a barebones single-process config: reads `DEVICE1_SPECS` and
  `DEVICE2_SPECS` from env, assigns them to per-capability `specs` arrays.
- Both capabilities share `BROWSERSTACK_BUILD_NAME` → one build on the
  BrowserStack Automate dashboard.
- `maxInstances: 5` per device (up from 1); concurrency is controlled by
  the capability-level `wdio:maxInstances`.

#### `test/suites/suite-a/` — **expanded**
- Added `suite-a-test11.js` through `suite-a-test20.js` (20 specs total).

#### `test/suites/suite-b/` — **expanded**
- Added `suite-b-test11.js` through `suite-b-test13.js` (13 specs total).
- 13 specs with 5+5 device limits produces D1=8, D2=5 — the clearest
  demonstration of Device 1 preference. Run with:
  `npm run test:preferred -- --suite=B`

# WDIO + BrowserStack Sample: Randomized Parallel Tests Across 2 Devices

A WebdriverIO project demonstrating randomized test distribution across two BrowserStack devices, with dynamic suite selection and two selectable run modes.

This project uses **CommonJS** (`require`/`module.exports`) throughout —
there is no `"type": "module"` in `package.json`, so it works with plain
`node`/`wdio` invocations without any ESM-related warnings.

## Setup

```bash
npm install
cp .env.example .env
# edit .env and add your BrowserStack username + access key
export $(cat .env | xargs)   # or use dotenv/your CI's secret injection
```

## Run mode 1 (default): even parallel split, 10 sessions at once

```bash
npm test
```

- Reads the `SUITE` environment variable (defaults to `default` if unset).
- Resolves all spec files matching the suite's glob patterns, shuffles them
  using a Fisher-Yates algorithm, and splits them 5/5 across two devices
  (Samsung Galaxy S23 on Chrome, iPhone 14 on Safari).
- Each device is allowed `wdio:maxInstances: 5`, so all 10 sessions run
  concurrently (5 per device).
- The split is randomized on every run — check the console output at
  the top of the run to see which specs landed on which device.
- Edit `wdio.conf.js` to change device names/OS versions, the number of
  devices, or `wdio:maxInstances` per device.

### Running a specific suite

```bash
SUITE=A npm test       # runs test/suites/suite-a/**/*.js
SUITE=B npm test       # runs test/suites/suite-b/**/*.js
SUITE=C npm test       # runs test/suites/suite-c/**/*.js
npm test               # runs test/specs/**/*.js (default fallback)
```

## Run mode 2 (optional): device 1 preferred, device 2 overflow only

```bash
npm run test:preferred
# or with a suite:
SUITE=A npm run test:preferred
```

- Uses `run-tests.js`, a small orchestrator that keeps a single shared
  queue of specs (no duplication) and always tries device 1 first.
  Device 2 only picks up work once device 1 has no free parallel slot.
- Whenever a spec finishes on either device, that freed slot is
  immediately offered back to device 1 first.
- Concurrency limits per device are set in `DEVICE_LIMITS` at the top of
  `run-tests.js`.
- This mode spawns one `wdio` process per spec (via
  `wdio.preferred.conf.js`), so if you use a reporter like Allure or
  Mochawesome you'll want to merge report fragments afterward.

## Suite definitions

Suites are defined in both `wdio.conf.js` and `run-tests.js` under the
`suites` object. Add new suites by mapping a name to an array of glob
patterns:

```js
const suites = {
  A: ['test/suites/suite-a/**/*.js'],
  B: ['test/suites/suite-b/**/*.js'],
  C: ['test/suites/suite-c/**/*.js'],
  priorityFt: [
    'tests/ui/e2e/patient_onboarding/query-param-cookies*.js',
    'tests/ui/e2e/patient_onboarding/generated_tests/*-st.spec.js'
  ],
  default: ['test/specs/**/*.js']
};
```

## Project structure

```
wdio-browserstack-randomtest-commonjs/
├── package.json
├── wdio.conf.js              # run mode 1: randomized split, full parallel
├── wdio.preferred.conf.js    # single-device config used by run mode 2
├── run-tests.js              # orchestrator for run mode 2
├── .env.example
└── test/
    ├── specs/                # default suite (test1.js … test10.js)
    └── suites/
        ├── suite-a/          # Suite A (suite-a-test1.js … suite-a-test10.js)
        ├── suite-b/          # Suite B (suite-b-test1.js … suite-b-test10.js)
        └── suite-c/          # Suite C (suite-c-test1.js … suite-c-test10.js)
```

## Notes

- The sample specs hit BrowserStack's public demo app
  (https://bstackdemo.com/) so the repo runs out of the box with no app
  of your own required. Replace the contents of `test/specs/*.js` or the
  suite folders with your real tests.
- To scale beyond 10 parallel sessions, bump `maxInstances` in
  `wdio.conf.js` and `DEVICE_LIMITS` in `run-tests.js`.
- To add a third device, add another capability object to `wdio.conf.js`
  and extend the split logic (currently a 2-way `slice`) to a 3-way
  division, or add it to `DEVICES` in `wdio.preferred.conf.js` and
  `DEVICE_LIMITS` in `run-tests.js`.
- The `glob` package is used to resolve wildcard suite patterns. It is
  listed under `dependencies` in `package.json` and installed via
  `npm install`.

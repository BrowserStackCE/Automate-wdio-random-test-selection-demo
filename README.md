# WDIO + BrowserStack Sample: 10 Parallel Tests Across 2 Devices

A minimal WebdriverIO project demonstrating 10 tests running in parallel
across two BrowserStack devices, with two selectable run modes.

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

- Scans `test/specs/` for all spec files, shuffles them, and splits them
  5/5 across two devices (Samsung Galaxy S23 on Chrome, iPhone 14 on
  Safari).
- Each device is allowed `maxInstances: 5`, so all 10 sessions run
  concurrently (5 per device).
- The split is randomized on every run -- check the console output at
  the top of the run to see which specs landed on which device.
- Edit `wdio.conf.js` to change device names/OS versions, the number of
  devices, or `maxInstances` per device (e.g. drop to `maxInstances: 3`
  per device if your BrowserStack plan has a lower parallel session cap).

## Run mode 2 (optional): device 1 preferred, device 2 overflow only

```bash
npm run test:preferred
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

## Project structure

```
wdio-browserstack-sample/
├── package.json
├── wdio.conf.js              # run mode 1: even random split, full parallel
├── wdio.preferred.conf.js    # single-device config used by run mode 2
├── run-tests.js              # orchestrator for run mode 2
├── .env.example
└── test/
    └── specs/
        ├── test1.js
        ├── ...
        └── test10.js
```

## Notes

- The sample specs hit BrowserStack's public demo app
  (https://bstackdemo.com/) so the repo runs out of the box with no app
  of your own required. Replace the contents of `test/specs/*.js` with
  your real tests.
- To scale beyond 10, add more spec files to `test/specs/` -- both run
  modes pick up new files automatically without any config changes
  (just bump `maxInstances` / `DEVICE_LIMITS` if you also want more
  concurrency).
- To add a third device, add another capability object to
  `wdio.conf.js` and extend the split logic (currently a 2-way
  `slice`) to a 3-way division, or add it to `DEVICES` in
  `wdio.preferred.conf.js` and `DEVICE_LIMITS` in `run-tests.js`.

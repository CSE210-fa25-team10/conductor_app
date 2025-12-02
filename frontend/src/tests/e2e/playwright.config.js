// @ts-check
const { devices } = require('@playwright/test');

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  testDir: './tests',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 5000,
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npx http-server ./ -p 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
};

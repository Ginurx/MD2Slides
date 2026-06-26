import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "test/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  use: {
    browserName: "chromium",
    baseURL: "http://127.0.0.1:4177",
    viewport: { width: 1280, height: 720 }
  },
  webServer: {
    command: "node ./bin/md2slides.js dev test/fixtures/e2e.md --host 127.0.0.1 --port 4177 --no-open",
    url: "http://127.0.0.1:4177",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});

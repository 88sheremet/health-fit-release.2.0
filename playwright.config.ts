import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  retries: 1,
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3100",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
  webServer: {
    command: "npx nuxt dev --port 3100",
    port: 3100,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

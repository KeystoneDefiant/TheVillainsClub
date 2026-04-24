import { defineConfig, devices } from "@playwright/test";

const previewHost = "127.0.0.1";
const previewPort = 4173;
const previewOrigin = `http://${previewHost}:${previewPort}`;

export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  webServer: {
    command: `npx vite preview --host ${previewHost} --port ${previewPort}`,
    url: previewOrigin,
    reuseExistingServer: !process.env.CI,
    timeout: 90_000,
  },
  use: {
    baseURL: previewOrigin,
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
});

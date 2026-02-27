import { defineConfig, devices } from "@playwright/test";

const chromiumExecutable =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ||
  "/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: "disabled",
    },
  },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { executablePath: chromiumExecutable },
      },
      testIgnore: /visual-regression/,
    },
    {
      name: "iPhone-14",
      use: {
        ...devices["iPhone 14"],
        browserName: "chromium",
        launchOptions: { executablePath: chromiumExecutable },
      },
      testMatch: /visual-regression\/.+\.spec\.ts/,
    },
    {
      name: "Pixel-7",
      use: {
        ...devices["Pixel 7"],
        launchOptions: { executablePath: chromiumExecutable },
      },
      testMatch: /visual-regression\/.+\.spec\.ts/,
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});

import { test, expect } from "@playwright/test";
import { waitForPageReady } from "./helpers";

test.describe("Notice Log - Visual Regression", () => {
  test("notice log page", async ({ page }) => {
    await page.goto("/notice-log");
    await waitForPageReady(page);

    await expect(page).toHaveScreenshot("notice-log.png", {
      fullPage: true,
    });
  });
});

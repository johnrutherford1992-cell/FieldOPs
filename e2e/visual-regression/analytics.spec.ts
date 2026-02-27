import { test, expect } from "@playwright/test";
import { waitForPageReady } from "./helpers";

test.describe("Analytics Dashboard - Visual Regression", () => {
  test("analytics dashboard", async ({ page }) => {
    await page.goto("/analytics");
    await waitForPageReady(page);

    await expect(page).toHaveScreenshot("analytics-dashboard.png", {
      fullPage: true,
      mask: [page.locator("text=/Last updated/")],
    });
  });
});

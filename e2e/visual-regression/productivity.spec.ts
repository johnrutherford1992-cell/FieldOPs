import { test, expect } from "@playwright/test";
import { waitForPageReady } from "./helpers";

test.describe("Productivity Dashboard - Visual Regression", () => {
  test("productivity dashboard", async ({ page }) => {
    await page.goto("/productivity");
    await waitForPageReady(page);

    await expect(page).toHaveScreenshot("productivity-dashboard.png", {
      fullPage: true,
      mask: [page.locator("text=/Last updated/")],
    });
  });
});

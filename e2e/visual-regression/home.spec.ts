import { test, expect } from "@playwright/test";
import { waitForPageReady } from "./helpers";

test.describe("Home Dashboard - Visual Regression", () => {
  test("dashboard", async ({ page }) => {
    await page.goto("/");
    await waitForPageReady(page);

    await expect(page).toHaveScreenshot("home-dashboard.png", {
      fullPage: true,
      mask: [page.locator("text=/\\w+day, \\w+ \\d+, \\d{4}/")],
    });
  });
});

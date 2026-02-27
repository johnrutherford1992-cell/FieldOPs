import { test, expect } from "@playwright/test";
import { waitForPageReady } from "./helpers";

test.describe("Reports Hub - Visual Regression", () => {
  test("reports hub page", async ({ page }) => {
    await page.goto("/reports");
    await waitForPageReady(page);

    await expect(page).toHaveScreenshot("reports-hub.png", {
      fullPage: true,
    });
  });
});

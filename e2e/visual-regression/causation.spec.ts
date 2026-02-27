import { test, expect } from "@playwright/test";
import { waitForPageReady } from "./helpers";

test.describe("Causation Chains - Visual Regression", () => {
  test("causation chains page", async ({ page }) => {
    await page.goto("/causation");
    await waitForPageReady(page);

    await expect(page).toHaveScreenshot("causation-chains.png", {
      fullPage: true,
    });
  });
});

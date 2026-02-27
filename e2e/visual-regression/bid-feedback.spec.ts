import { test, expect } from "@playwright/test";
import { waitForPageReady } from "./helpers";

test.describe("Bid Feedback - Visual Regression", () => {
  test("bid feedback tab", async ({ page }) => {
    await page.goto("/bid-feedback");
    await waitForPageReady(page);

    await expect(page).toHaveScreenshot("bid-feedback.png", {
      fullPage: true,
    });
  });

  test("unit price book tab", async ({ page }) => {
    await page.goto("/bid-feedback");
    await waitForPageReady(page);

    const unitTab = page
      .locator(
        'button:has-text("Unit Price"), [role="tab"]:has-text("Unit Price")'
      )
      .first();
    if (await unitTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await unitTab.click();
      await page.waitForTimeout(500);
    }

    await expect(page).toHaveScreenshot("bid-feedback-unit-prices.png", {
      fullPage: true,
    });
  });
});

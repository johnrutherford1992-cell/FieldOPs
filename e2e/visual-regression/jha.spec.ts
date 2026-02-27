import { test, expect } from "@playwright/test";
import { waitForPageReady } from "./helpers";

test.describe("JHA Workflow - Visual Regression", () => {
  test("JHA landing page", async ({ page }) => {
    await page.goto("/jha");
    await waitForPageReady(page);

    await expect(page).toHaveScreenshot("jha-landing.png", {
      fullPage: true,
    });
  });

  test("JHA step 1 - task selection", async ({ page }) => {
    await page.goto("/jha");
    await waitForPageReady(page);

    const startBtn = page.locator('button:has-text("Start")');
    if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    await expect(page).toHaveScreenshot("jha-task-selection.png", {
      fullPage: true,
    });
  });
});

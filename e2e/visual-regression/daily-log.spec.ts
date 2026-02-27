import { test, expect } from "@playwright/test";
import { waitForPageReady } from "./helpers";

test.describe("Daily Log - Visual Regression", () => {
  test("daily log landing page", async ({ page }) => {
    await page.goto("/daily-log");
    await waitForPageReady(page);

    await expect(page).toHaveScreenshot("daily-log-landing.png", {
      fullPage: true,
      mask: [page.locator("text=/\\w+day, \\w+ \\d+, \\d{4}/")],
    });
  });

  test("daily log weather screen", async ({ page }) => {
    await page.goto("/daily-log");
    await waitForPageReady(page);

    const startBtn = page.locator('button:has-text("Start")');
    if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    await expect(page).toHaveScreenshot("daily-log-weather.png", {
      fullPage: true,
    });
  });

  test("daily log work performed screen", async ({ page }) => {
    await page.goto("/daily-log");
    await waitForPageReady(page);

    const startBtn = page.locator('button:has-text("Start")');
    if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }

    // Navigate forward 3 screens to reach Work Performed
    for (let i = 0; i < 3; i++) {
      const nextBtn = page
        .locator('button:has-text("Continue"), button:has-text("Skip")')
        .first();
      if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(500);
      }
    }

    await expect(page).toHaveScreenshot("daily-log-work-performed.png", {
      fullPage: true,
    });
  });
});

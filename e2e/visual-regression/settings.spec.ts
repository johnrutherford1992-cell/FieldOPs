import { test, expect } from "@playwright/test";
import { waitForPageReady } from "./helpers";

test.describe("Settings Page - Visual Regression", () => {
  test("settings page light mode", async ({ page }) => {
    await page.goto("/settings");
    await waitForPageReady(page);

    await expect(page).toHaveScreenshot("settings-light.png", {
      fullPage: true,
    });
  });

  test("settings page dark mode", async ({ page }) => {
    await page.goto("/settings");
    await waitForPageReady(page);

    // Toggle dark mode via the toggle switch
    const darkModeToggle = page.locator(
      'button:near(:text("Dark Mode"), 200)'
    );
    if (await darkModeToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await darkModeToggle.click();
      await page.waitForTimeout(500);
    }

    await expect(page).toHaveScreenshot("settings-dark.png", {
      fullPage: true,
    });
  });
});

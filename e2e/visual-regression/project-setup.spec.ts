import { test, expect } from "@playwright/test";
import { waitForPageReady } from "./helpers";

test.describe("Project Setup - Visual Regression", () => {
  test("project details tab", async ({ page }) => {
    await page.goto("/project-setup");
    await waitForPageReady(page);

    await expect(page).toHaveScreenshot("project-setup-details.png", {
      fullPage: true,
    });
  });

  test("subcontractors tab", async ({ page }) => {
    await page.goto("/project-setup");
    await waitForPageReady(page);

    const subTab = page
      .locator(
        'button:has-text("Subcontractors"), [role="tab"]:has-text("Subcontractors")'
      )
      .first();
    if (await subTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await subTab.click();
      await page.waitForTimeout(500);
    }

    await expect(page).toHaveScreenshot("project-setup-subcontractors.png", {
      fullPage: true,
    });
  });

  test("equipment tab", async ({ page }) => {
    await page.goto("/project-setup");
    await waitForPageReady(page);

    const equipTab = page
      .locator(
        'button:has-text("Equipment"), [role="tab"]:has-text("Equipment")'
      )
      .first();
    if (await equipTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await equipTab.click();
      await page.waitForTimeout(500);
    }

    await expect(page).toHaveScreenshot("project-setup-equipment.png", {
      fullPage: true,
    });
  });
});

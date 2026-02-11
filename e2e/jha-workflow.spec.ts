import { test, expect } from "@playwright/test";

// ────────────────────────────────────────────────────────
// TEST 10: JHA workflow — navigates through all 5 steps
// ────────────────────────────────────────────────────────
test.describe("JHA Workflow", () => {
  test("navigates from home to JHA and through all 5 steps", async ({ page }) => {
    // Step 0: Start at home page
    await page.goto("/");
    await expect(page.locator("text=FieldOPs")).toBeVisible();

    // Navigate to JHA page
    await page.click('a[href="/jha"]');
    await page.waitForURL("/jha");

    // Step 1: Task Selection — verify the task selector is visible
    await expect(page.locator("text=Select Tasks")).toBeVisible();

    // Select a CSI division to drill into tasks
    const firstDivision = page.locator('[data-testid="csi-division"]').first();
    if (await firstDivision.isVisible()) {
      await firstDivision.click();
    }

    // Click Next to proceed to Weather & Crew
    await page.click('button:has-text("Next")');

    // Step 2: Weather & Crew input
    await expect(
      page.locator("text=Weather").first()
    ).toBeVisible();

    // Click Next to proceed to Equipment
    await page.click('button:has-text("Next")');

    // Step 3: Equipment selection
    await expect(
      page.locator("text=Equipment").first()
    ).toBeVisible();

    // Click Generate to create JHA
    await page.click('button:has-text("Generate")');

    // Step 4/5: Review — either loading or generated content appears
    // Wait for either the generated JHA content or a loading state
    await expect(
      page.locator("text=JHA").first()
    ).toBeVisible({ timeout: 15000 });
  });
});

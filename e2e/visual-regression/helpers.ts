import { Page } from "@playwright/test";

/**
 * Wait for the app to stabilize after navigation.
 * Dismisses any Next.js error overlay and waits for content to render.
 */
export async function waitForPageReady(page: Page) {
  // Wait for initial paint
  await page.waitForLoadState("domcontentloaded");

  // Give the app time to initialize (IndexedDB/Supabase)
  await page.waitForTimeout(2000);

  // Dismiss Next.js error overlay if present
  const hideErrorsBtn = page.locator('button:has-text("Hide Errors")');
  if (await hideErrorsBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await hideErrorsBtn.click();
    await page.waitForTimeout(300);
  }

  // Try to wait for the spinner to disappear (app fully initialized)
  await page
    .waitForSelector(".animate-spin", { state: "detached", timeout: 5000 })
    .catch(() => {
      // App may not have fully initialized (e.g., missing Supabase config)
    });

  // Final stabilization
  await page.waitForTimeout(500);
}

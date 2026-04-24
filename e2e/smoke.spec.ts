import { test, expect } from "@playwright/test";

test("main menu to club floor", async ({ page }) => {
  await page.goto("/menu");
  await page.getByRole("button", { name: /enter the club/i }).click();
  await expect(page).toHaveURL(/\/bar$/);
  await expect(page.getByText("Tables", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /oubliette no\. 9 \(table\)/i })).toBeVisible();
});

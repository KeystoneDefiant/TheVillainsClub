import { test, expect } from "@playwright/test";

test("main menu to club floor", async ({ page }) => {
  await page.goto("/menu");
  await page.getByRole("button", { name: /enter the club/i }).click();
  await expect(page).toHaveURL(/\/bar$/);
  await expect(page.getByText("Tables", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /oubliette no\. 9 \(table\)/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /7 year itch \(crapless\)/i })).toBeVisible();
});

test("club table buy-in opens Oubliette No. 9", async ({ page }) => {
  await page.goto("/menu");
  await page.getByRole("button", { name: /enter the club/i }).click();
  await expect(page).toHaveURL(/\/bar$/);

  await page.getByRole("button", { name: /oubliette no\. 9 \(table\)/i }).click();
  await expect(page).toHaveURL(/\/minigames\/oubliette-no9$/);

  await expect(page.locator("#mainMenu-screen")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { name: /oubliette number 9/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^start run$/i })).toBeVisible();
});

test("club table buy-in opens 7 Year Itch", async ({ page }) => {
  await page.goto("/menu");
  await page.getByRole("button", { name: /enter the club/i }).click();
  await expect(page).toHaveURL(/\/bar$/);

  await page.getByRole("button", { name: /7 year itch \(crapless\)/i }).click();
  await expect(page).toHaveURL(/\/minigames\/seven-year-itch$/);

  await expect(page.getByTestId("seven-year-itch-root")).toBeVisible({ timeout: 30_000 });
  const pass = page.getByTestId("felt-pass");
  await pass.click();
  await pass.click();
  await expect(page.getByRole("button", { name: /^roll$/i })).toBeEnabled();
  await expect(page.getByRole("button", { name: /return to the bar/i })).toBeVisible();
});

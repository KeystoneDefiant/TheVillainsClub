import { test, expect } from "@playwright/test";

test("main menu to club floor", async ({ page }) => {
  await page.goto("/menu");
  await page.getByRole("button", { name: /enter the club/i }).click();
  await expect(page).toHaveURL(/\/bar$/);
  await expect(page.getByText("Tonight’s menu", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /oubliette no\. 9/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /7 year itch/i })).toBeVisible();
});

test("club table buy-in opens Oubliette No. 9", async ({ page }) => {
  await page.goto("/menu");
  await page.getByRole("button", { name: /enter the club/i }).click();
  await expect(page).toHaveURL(/\/bar$/);

  await page.getByRole("button", { name: /oubliette no\. 9/i }).click();
  await expect(page.getByRole("heading", { name: /oubliette no\. 9/i })).toBeVisible();
  await page.getByRole("button", { name: /start game/i }).click();
  await expect(page).toHaveURL(/\/minigames\/oubliette-no9$/);

  await expect(page.locator("#preDraw-screen")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: /run round/i })).toBeVisible();
  await expect(page.locator("#mainMenu-screen")).toHaveCount(0);
});

test("mobile Oubliette game over can return to the bar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 520 });
  await page.goto("/menu");
  await page.getByRole("button", { name: /enter the club/i }).click();
  await expect(page).toHaveURL(/\/bar$/);

  await page.getByRole("button", { name: /oubliette no\. 9/i }).click();
  await page.getByRole("button", { name: /start game/i }).click();
  await expect(page).toHaveURL(/\/minigames\/oubliette-no9$/);

  await expect(page.locator("#preDraw-screen")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: /end current run and return to main menu/i }).click();
  await page.getByRole("button", { name: /confirm end run/i }).click();

  const gameOver = page.locator(".game-over-screen");
  const returnButton = page.getByRole("button", { name: /return to main menu/i });
  await expect(gameOver).toBeVisible();
  await expect(returnButton).toBeAttached();
  await returnButton.scrollIntoViewIfNeeded();
  await expect(returnButton).toBeInViewport();
  await returnButton.click();

  await expect(page).toHaveURL(/\/bar$/);
  await expect(page.getByText("Tonight’s menu", { exact: true })).toBeVisible();
});

test("standalone Oubliette landing starts the table", async ({ page }) => {
  await page.goto("/oubliette-no9");
  await expect(page.getByRole("heading", { name: /oubliette no\. 9/i })).toBeVisible();
  await expect(page.getByText(/standalone table/i)).toBeVisible();

  await page.getByRole("button", { name: /start oubliette/i }).click();
  await expect(page).toHaveURL(/\/minigames\/oubliette-no9$/);
  await expect(page.locator("#preDraw-screen")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: /run round/i })).toBeVisible();
  await expect(page.locator("#mainMenu-screen")).toHaveCount(0);
});

test("club table buy-in opens 7 Year Itch", async ({ page }) => {
  await page.goto("/menu");
  await page.getByRole("button", { name: /enter the club/i }).click();
  await expect(page).toHaveURL(/\/bar$/);

  await page.getByRole("button", { name: /7 year itch/i }).click();
  await expect(page.getByRole("heading", { name: /7 year itch/i })).toBeVisible();
  await page.getByRole("button", { name: /start game/i }).click();
  await expect(page).toHaveURL(/\/minigames\/seven-year-itch$/);

  await expect(page.getByTestId("seven-year-itch-root")).toBeVisible({ timeout: 30_000 });
  const pass = page.getByTestId("felt-pass");
  await pass.click();
  await pass.click();
  await expect(page.getByRole("button", { name: /^roll$/i })).toBeEnabled();
  await expect(page.getByRole("button", { name: /save and return later/i })).toBeVisible();
});

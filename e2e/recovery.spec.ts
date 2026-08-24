import { test, expect } from "@playwright/test";
import { mockScreeningCompleted } from "./helpers/supabase-mock";

test.describe("Menu page", () => {
  test("renders menu with navigation tabs", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/menu");

    await expect(page.locator(".title").first()).toBeVisible();
    await expect(page.locator(".tab-card").first()).toBeVisible();
    await expect(page.locator(".tab-card")).toHaveCount(3);
  });

  test("daily tab navigates to /daily", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/menu");

    await page.locator(".tab-card").first().click();
    await expect(page).toHaveURL(/\/daily/);
  });

  test("weekly tab navigates to /weekly", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/menu");

    await page.locator(".tab-card").nth(1).click();
    await expect(page).toHaveURL(/\/weekly/);
  });

  test("journal tab navigates to /journal", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/menu");

    await page.locator(".tab-card").nth(2).click();
    await expect(page).toHaveURL(/\/journal/);
  });
});

test.describe("Daily page", () => {
  test("renders greeting and energy card", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/daily");

    await expect(page.locator(".header").first()).toBeVisible();
    await expect(page.locator(".energy-card")).toBeVisible();
  });

  test("shows streak badge", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/daily");

    await expect(page.locator(".streak-avatar")).toBeVisible();
  });

  test("shows bottom navigation", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/daily");

    await expect(page.locator(".bottom-navigation, nav, [class*='bottom']").first()).toBeVisible();
  });
});

test.describe("Weekly page", () => {
  test("renders weekly task info", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/weekly");

    await expect(page.locator(".title").first()).toBeVisible();
    await expect(page.locator(".task-card")).toBeVisible();
  });

  test("shows week number and day", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/weekly");

    await expect(page.locator(".subtitle").first()).toBeVisible();
  });
});

test.describe("Journal page", () => {
  test("renders journal with actions", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/journal");

    await expect(page.locator(".hero-title, .title").first()).toBeVisible();
    await expect(page.locator(".action-card").first()).toBeVisible();
    await expect(page.locator(".action-card")).toHaveCount(3);
  });

  test("clicking chart action navigates to chart", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/journal");

    await page.locator(".action-card").first().click();
    await expect(page).toHaveURL(/\/journal-chart/);
  });

  test("clicking archive action navigates to archive", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/journal");

    await page.locator(".action-card").nth(2).click();
    await expect(page).toHaveURL(/\/journal-archive/);
  });

  test("note action opens dialog", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/journal");

    await page.locator(".note-card").click();
    await expect(page.locator(".dialog-card, [role='dialog']").first()).toBeVisible();
  });
});

test.describe("Navigation guard", () => {
  test("unauthenticated user is redirected to /login", async ({ page }) => {
    await page.goto("/daily");
    await expect(page).toHaveURL(/\/login/);
  });
});

import { test, expect } from "@playwright/test";
import { mockSupabaseAuth, mockScreeningCompleted } from "./helpers/supabase-mock";

test.describe("Welcome page", () => {
  test("renders welcome content", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/welcome");

    await expect(page.locator(".hero-section .title")).toBeVisible();
    await expect(page.locator(".hero-icon")).toBeVisible();
    await expect(page.locator(".benefits-card")).toBeVisible();
  });

  test("start button navigates to screening", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/welcome");

    await page.locator(".start-btn").click();
    await expect(page).toHaveURL(/\/screening/, { timeout: 10000 });
  });
});

test.describe("Screening page", () => {
  test("renders screening intro with start button", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/screening");

    await expect(page.locator(".screening-page .title")).toBeVisible();
    await expect(page.locator(".start-btn")).toBeVisible();
    await expect(page.locator(".skip-btn")).toBeVisible();
  });

  test("start button navigates to questions", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/screening");

    await page.locator(".start-btn").click();
    await expect(page).toHaveURL(/\/questions/, { timeout: 10000 });
  });

  test("skip button goes to menu", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/screening");

    await page.locator(".skip-btn").click();
    await expect(page).toHaveURL(/\/(menu|daily)/, { timeout: 10000 });
  });
});

test.describe("Questions flow", () => {
  test("renders question cards with answer buttons", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/questions");

    await expect(page.locator(".question-card").first()).toBeVisible();
    await expect(page.locator(".question-card .answer-btn").first()).toBeVisible();
    await expect(page.locator(".next-btn")).toBeVisible();
  });

  test("shows block counter and progress bar", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/questions");

    await expect(page.locator(".block-counter")).toBeVisible();
    await expect(page.locator(".questions-counter")).toBeVisible();
  });

  test("answer buttons become active on click", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/questions");

    const firstAnswer = page.locator(".question-card").first().locator(".answer-btn").first();
    await firstAnswer.click();
    await expect(firstAnswer).toHaveClass(/active/);
  });

  test("clicking next without answers shows validation", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/questions");

    await page.locator(".next-btn").click();

    await expect(
      page.locator(".question-card.invalid").first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("answering all block 1 questions and clicking next advances to block 2", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/questions");

    await expect(page.locator(".question-card").first()).toBeVisible({ timeout: 15000 });
    const count = await page.locator(".question-card").count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const card = page.locator(".question-card").nth(i);
      await card.scrollIntoViewIfNeeded();
      await card.locator(".answer-btn").nth(2).click();
    }

    await page.locator(".next-btn").scrollIntoViewIfNeeded();
    await page.locator(".next-btn").click();

    await expect(page.locator(".block-counter")).toContainText("2", { timeout: 10000 });
  });
});

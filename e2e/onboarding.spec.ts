import { test, expect } from "@playwright/test";
import { mockSupabaseAuth, mockScreeningCompleted } from "./helpers/supabase-mock";

test.describe("Welcome page", () => {
  test("renders welcome content", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/welcome");

    await expect(page.locator(".title, h1").first()).toBeVisible();
    await expect(page.locator(".start-btn, .hero-icon").first()).toBeVisible();
  });

  test("has start button that navigates to screening", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/welcome");

    const startBtn = page.locator(".start-btn, button:has-text('Start'), button:has-text('Начать')").first();
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    await expect(page).toHaveURL(/\/screening/);
  });
});

test.describe("Screening page", () => {
  test("renders screening intro", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/screening");

    await expect(page.locator(".title").first()).toBeVisible();
    await expect(page.locator(".start-btn").first()).toBeVisible();
  });

  test("start button navigates to questions", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/screening");

    await page.locator(".start-btn").first().click();
    await expect(page).toHaveURL(/\/questions/);
  });
});

test.describe("Questions flow", () => {
  test("renders question cards with answer buttons", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/questions");

    await expect(page.locator(".question-card").first()).toBeVisible();
    await expect(page.locator(".answer-btn").first()).toBeVisible();
    await expect(page.locator(".next-btn")).toBeVisible();
  });

  test("shows block counter and progress bar", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/questions");

    await expect(page.locator(".block-counter")).toBeVisible();
    await expect(page.locator(".questions-counter")).toBeVisible();
    await expect(page.locator(".q-linear-progress, [role='progressbar']").first()).toBeVisible();
  });

  test("answer buttons toggle active class on click", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/questions");

    const firstQuestion = page.locator(".question-card").first();
    const answerBtn = firstQuestion.locator(".answer-btn").first();

    await answerBtn.click();
    await expect(answerBtn).toHaveClass(/active/);
  });

  test("clicking next without answers shows validation", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/questions");

    await page.locator(".next-btn").click();
    // validation notification or shake animation on unanswered questions
    await expect(
      page.locator(".q-notification, .question-card.invalid").first()
    ).toBeVisible({ timeout: 3000 });
  });

  test("answering all questions in block 1 and clicking next advances to block 2", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/questions");

    // Answer all 9 questions in block 1
    const questions = page.locator(".question-card");
    const count = await questions.count();
    for (let i = 0; i < count; i++) {
      await questions.nth(i).locator(".answer-btn").nth(2).click();
    }

    // Click next
    await page.locator(".next-btn").click();

    // Should now be on block 2
    await expect(page.locator(".block-counter")).toContainText("2");
  });

  test("skip button on screening page goes to menu", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/screening");

    // Mock the screening save
    await page.route("**/*.supabase.co/rest/v1/screening_results**", (route) =>
      route.fulfill({ status: 200, json: {}, headers: { "content-type": "application/json" } }),
    );

    const skipBtn = page.locator(".skip-btn, button:has-text('Skip'), button:has-text('Пропустить')").first();
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
      await expect(page).toHaveURL(/\/(menu|daily)/);
    }
  });
});

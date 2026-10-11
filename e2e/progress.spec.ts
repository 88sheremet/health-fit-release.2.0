import { test, expect } from "@playwright/test";
import { freezeDateToMonday, mockProgressData } from "./helpers/supabase-mock";

const LOCALE_COOKIE = {
  name: "i18n_locale",
  domain: "localhost",
  path: "/",
};

async function setLocale(page: any, locale: "ru" | "uk") {
  await page.context().addCookies([{ ...LOCALE_COOKIE, value: locale }]);
}

/**
 * Одинаковый датасет, что и в tests/integration/progressFlow.test.ts —
 * дата заморожена на понедельнике 2026-08-03, поэтому границы окон
 * 2026-07-28 (сейчас) и 2026-07-21 (неделю назад) детерминированы.
 */
const PROGRESS_DATA = {
  userProgress: { energy: 420, streak: 5, start_date: "2026-07-01" },

  energyHistory: [
    { energy: 250, created_at: "2026-07-24T10:00:00" },
    { energy: 300, created_at: "2026-07-27T10:00:00" },
    { energy: 350, created_at: "2026-07-29T10:00:00" },
    { energy: 420, created_at: "2026-08-02T10:00:00" },
  ],

  completions: [
    { task_id: "task-3", day_index: 0, completed_at: "2026-07-25T10:00:00" },
    { task_id: "task-1", day_index: 0, completed_at: "2026-07-29T10:00:00" },
    { task_id: "task-1", day_index: 1, completed_at: "2026-07-30T10:00:00" },
    { task_id: "task-2", day_index: 2, completed_at: "2026-07-31T10:00:00" },
  ],

  journalEntries: [
    { date: "2026-07-25", mood: 3, entry_type: "checkin" },
    { date: "2026-07-26", mood: 4, entry_type: "checkin" },
    { date: "2026-07-30", mood: 5, entry_type: "checkin" },
    { date: "2026-08-01", mood: 4, entry_type: "checkin" },
    { date: "2026-08-02", mood: null, entry_type: "note" },
  ],
};

const EMPTY_PROGRESS_DATA = {
  userProgress: { energy: 0, streak: 0, start_date: "2026-07-01" },
  energyHistory: [],
  completions: [],
  journalEntries: [],
};

test.describe("Progress page", () => {
  test.beforeEach(async ({ page }) => {
    await freezeDateToMonday(page);
    await mockProgressData(page, PROGRESS_DATA);
    await setLocale(page, "ru");
  });

  test("renders all four summary cards", async ({ page }) => {
    await page.goto("/progress");

    await expect(page.locator(".title")).toContainText("Твой прогресс", {
      timeout: 20000,
    });

    const cards = page.locator(".progress-card");
    await expect(cards).toHaveCount(4);

    await expect(cards.nth(0).locator(".card-title")).toContainText("Энергия");
    await expect(cards.nth(1).locator(".card-title")).toContainText("Серия");
    await expect(cards.nth(2).locator(".card-title")).toContainText("Настроение");
    await expect(cards.nth(3).locator(".card-title")).toContainText("Задания");
  });

  test("shows energy, its 7-day delta and a progress bar", async ({ page }) => {
    await page.goto("/progress");

    const energyCard = page.locator(".progress-card").nth(0);

    await expect(energyCard.locator(".energy-value")).toBeVisible({
      timeout: 20000,
    });
    await expect(energyCard.locator(".energy-value")).toContainText("420 / 1000");
    await expect(energyCard.locator(".change")).toContainText("+120");
    await expect(energyCard.locator(".change")).toContainText(
      "за последние 7 дней",
    );

    await expect(page.locator(".q-linear-progress").first()).toBeVisible();
  });

  test("shows streak in days", async ({ page }) => {
    await page.goto("/progress");

    const streakCard = page.locator(".progress-card").nth(1);

    await expect(streakCard.locator(".big-value")).toBeVisible({
      timeout: 20000,
    });
    await expect(streakCard.locator(".big-value")).toContainText("5");
    await expect(streakCard.locator(".big-value")).toContainText("дней");
  });

  test("shows mood average and its delta with an arrow", async ({ page }) => {
    await page.goto("/progress");

    const moodCard = page.locator(".progress-card").nth(2);

    await expect(moodCard.locator(".big-value")).toBeVisible({
      timeout: 20000,
    });
    await expect(moodCard.locator(".big-value")).toContainText("4.5 / 5");

    await expect(moodCard.locator(".change")).toContainText("↑");
    await expect(moodCard.locator(".change")).toContainText("1.0");
  });

  test("shows tasks completed, total and percentage", async ({ page }) => {
    await page.goto("/progress");

    const tasksCard = page.locator(".progress-card").nth(3);

    await expect(tasksCard.locator(".big-value")).toBeVisible({
      timeout: 20000,
    });
    await expect(tasksCard.locator(".big-value")).toContainText("3");
    await expect(tasksCard.locator(".big-value")).toContainText("22");
    await expect(tasksCard.locator(".change")).toContainText("14%");
  });

  test("renders the three weekly categories with their percentages", async ({
    page,
  }) => {
    await page.goto("/progress");

    await expect(page.locator(".section-title")).toContainText(
      "На этой неделе",
      { timeout: 20000 },
    );

    const categories = page.locator(".category");
    await expect(categories).toHaveCount(3);

    await expect(categories.nth(0).locator(".category-header")).toContainText(
      "Физическое",
    );
    await expect(categories.nth(0).locator(".category-header")).toContainText(
      "0%",
    );

    await expect(categories.nth(1).locator(".category-header")).toContainText(
      "Питание",
    );
    await expect(categories.nth(1).locator(".category-header")).toContainText(
      "29%",
    );

    await expect(categories.nth(2).locator(".category-header")).toContainText(
      "Ментальное",
    );
    await expect(categories.nth(2).locator(".category-header")).toContainText(
      "14%",
    );
  });

  test("highlights the screening category as the focus", async ({ page }) => {
    await page.goto("/progress");

    await expect(page.locator(".focus-title")).toContainText("Твой фокус", {
      timeout: 20000,
    });

    await expect(page.locator(".focus-category")).toContainText(
      "Физическое восстановление",
    );

    await expect(page.locator(".focus-text")).toContainText(
      "На этой неделе ты выполнил 0 задач в этом направлении.",
    );
  });

  test("does not leak raw i18n keys, undefined or null", async ({ page }) => {
    await page.goto("/progress");

    await expect(page.locator(".focus")).toBeVisible({ timeout: 20000 });

    const text = await page.locator(".page").innerText();

    expect(text).not.toContain("undefined");
    expect(text).not.toContain("null");
    expect(text).not.toMatch(/progress\./);
    expect(text).not.toMatch(/\{count\}/);
  });

  test("renders Ukrainian translations when locale is uk", async ({ page }) => {
    await setLocale(page, "uk");
    await page.goto("/progress");

    await expect(page.locator(".title")).toContainText("Твій прогрес", {
      timeout: 20000,
    });

    const cards = page.locator(".progress-card");
    await expect(cards.nth(0).locator(".card-title")).toContainText("Енергія");
    await expect(cards.nth(1).locator(".card-title")).toContainText("Серія");
    await expect(cards.nth(2).locator(".card-title")).toContainText("Настрій");
    await expect(cards.nth(3).locator(".card-title")).toContainText("Завдання");

    await expect(page.locator(".section-title")).toContainText("Цього тижня");

    await expect(page.locator(".focus-category")).toContainText(
      "Фізичне відновлення",
    );
    await expect(page.locator(".focus-text")).toContainText(
      "Цього тижня ти виконав 0 завдань у цьому напрямку.",
    );
  });

  test("shows the loading spinner while data is being fetched", async ({
    page,
  }) => {
    await page.goto("/progress");

    await expect(page.locator(".loading")).toBeHidden({ timeout: 20000 });
    await expect(page.locator(".progress-card").first()).toBeVisible();
  });
});

test.describe("Progress page — empty state", () => {
  test.beforeEach(async ({ page }) => {
    await freezeDateToMonday(page);
    await setLocale(page, "ru");
  });

  test("renders zeroes instead of crashing when every table is empty", async ({
    page,
  }) => {
    await mockProgressData(page, EMPTY_PROGRESS_DATA);
    await page.goto("/progress");

    await expect(page.locator(".title")).toContainText("Твой прогресс", {
      timeout: 20000,
    });

    const cards = page.locator(".progress-card");

    await expect(cards.nth(0).locator(".energy-value")).toContainText(
      "0 / 1000",
    );
    await expect(cards.nth(0).locator(".change")).toContainText("+0");

    await expect(cards.nth(2).locator(".big-value")).toContainText("0 / 5");
    await expect(cards.nth(3).locator(".big-value")).toContainText("0 / 22");

    const categories = page.locator(".category");
    await expect(categories.nth(0).locator(".category-header")).toContainText(
      "0%",
    );
    await expect(categories.nth(1).locator(".category-header")).toContainText(
      "0%",
    );
    await expect(categories.nth(2).locator(".category-header")).toContainText(
      "0%",
    );

    const text = await page.locator(".page").innerText();

    expect(text).not.toContain("undefined");
    expect(text).not.toContain("NaN");
  });

  test("picks the screening category as the focus even with no data", async ({
    page,
  }) => {
    await mockProgressData(page, EMPTY_PROGRESS_DATA);
    await page.goto("/progress");

    await expect(page.locator(".focus-category")).toContainText(
      "Физическое восстановление",
      { timeout: 20000 },
    );
  });
});

/**
 * Недельное задание входит только в общий счётчик «Задания» (22 = 21 дневное
 * + 1 недельное) и не трогает категории. Фильтр по периоду выполняется в
 * Postgres через `completed_at=gte.` — мок воспроизводит его, а не возвращает
 * посев как есть.
 */
test.describe("Progress page — недельные задания", () => {
  test.beforeEach(async ({ page }) => {
    await freezeDateToMonday(page);
    await setLocale(page, "ru");
  });

  test("adds an in-period weekly completion to the total only", async ({
    page,
  }) => {
    await mockProgressData(page, {
      ...PROGRESS_DATA,
      weeklyCompletions: [
        // внутри текущего периода 2026-07-28 .. 2026-08-03
        { weekly_task_id: "wt-1", week: 1, completed_at: "2026-08-01T10:00:00" },
        // до границы периода — должно отсечься фильтром completed_at=gte.
        { weekly_task_id: "wt-1", week: 1, completed_at: "2026-07-27T10:00:00" },
      ],
    });

    await page.goto("/progress");

    const tasksCard = page.locator(".progress-card").nth(3);

    await expect(tasksCard.locator(".big-value")).toBeVisible({
      timeout: 20000,
    });
    await expect(tasksCard.locator(".big-value")).toContainText("4");
    await expect(tasksCard.locator(".big-value")).toContainText("22");
    await expect(tasksCard.locator(".change")).toContainText("18%");

    const categories = page.locator(".category");

    await expect(categories.nth(0).locator(".category-header")).toContainText(
      "0%",
    );
    await expect(categories.nth(1).locator(".category-header")).toContainText(
      "29%",
    );
    await expect(categories.nth(2).locator(".category-header")).toContainText(
      "14%",
    );
  });

  test("ignores a weekly completion from before the current period", async ({
    page,
  }) => {
    await mockProgressData(page, {
      ...PROGRESS_DATA,
      weeklyCompletions: [
        { weekly_task_id: "wt-1", week: 1, completed_at: "2026-07-27T10:00:00" },
      ],
    });

    await page.goto("/progress");

    const tasksCard = page.locator(".progress-card").nth(3);

    await expect(tasksCard.locator(".big-value")).toContainText("3", {
      timeout: 20000,
    });
    await expect(tasksCard.locator(".big-value")).toContainText("22");
    await expect(tasksCard.locator(".change")).toContainText("14%");
  });
});

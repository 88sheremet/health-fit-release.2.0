import { test, expect } from "@playwright/test";
import {
  mockScreeningCompleted,
  freezeDateToMonday,
} from "./helpers/supabase-mock";

const LOCALE_COOKIE = {
  name: "i18n_locale",
  domain: "localhost",
  path: "/",
};

async function setLocale(page: any, locale: "ru" | "uk") {
  await page.context().addCookies([
    { ...LOCALE_COOKIE, value: locale },
  ]);
}

/**
 * The Journal auto-opens a persistent CheckIn dialog on /daily when there is no
 * checkin entry for today. It has no close button, so dismiss it by selecting a
 * mood and saving. This is app behaviour unrelated to daily-task localization,
 * but its backdrop otherwise blocks clicks on the page.
 */
async function dismissCheckIn(page: any) {
  const dialog = page.locator(".checkin-card");
  await expect(dialog).toBeVisible({ timeout: 10000 });
  await page.locator(".checkin-card .mood-btn").first().click();
  await page.locator(".checkin-card .save-btn").click();
  await expect(dialog).toBeHidden();
}

test.describe("Daily tasks localization", () => {
  test.beforeEach(async ({ page }) => {
    await freezeDateToMonday(page);
    await mockScreeningCompleted(page);
    await setLocale(page, "ru");
  });

  test("renders 3 daily tasks in Russian", async ({ page }) => {
    await page.goto("/daily");

    await expect(page.locator(".energy-card")).toBeVisible({ timeout: 20000 });

    await expect(page.locator(".task-card")).toHaveCount(3);
    await expect(page.locator(".task-card").nth(0).locator(".task-title")).toHaveText("Завтрак");
    await expect(page.locator(".task-card").nth(1).locator(".task-title")).toHaveText("Медитация");
    await expect(page.locator(".task-card").nth(2).locator(".task-title")).toHaveText("Прогулка");
  });

  test("renders Ukrainian translations when locale is uk", async ({ page }) => {
    await setLocale(page, "uk");
    await page.goto("/daily");

    await expect(page.locator(".task-card")).toHaveCount(3, { timeout: 20000 });
    await expect(page.locator(".task-card").nth(0).locator(".task-title")).toHaveText("Сніданок");
    await expect(page.locator(".task-card").nth(1).locator(".task-title")).toHaveText("Медитація");
    await expect(page.locator(".task-card").nth(2).locator(".task-title")).toHaveText("Прогулянка");
  });

  test("switching locale reloads translated tasks without a fresh auth session", async ({
    page,
  }) => {
    await page.goto("/daily");
    await expect(page.locator(".task-card").nth(0).locator(".task-title")).toHaveText("Завтрак", { timeout: 20000 });

    await setLocale(page, "uk");
    await page.reload();

    await expect(page.locator(".task-card")).toHaveCount(3, { timeout: 20000 });
    await expect(page.locator(".task-card").nth(0).locator(".task-title")).toHaveText("Сніданок");
  });

  test("task details dialog shows translated what/why without undefined text", async ({
    page,
  }) => {
    await page.goto("/daily");
    await dismissCheckIn(page);

    await page.locator(".task-card").nth(0).click();

    await expect(page.locator(".dialog .title")).toHaveText("Завтрак");
    const dialogText = await page.locator(".dialog .text").allTextContents();
    const joined = dialogText.join(" ");
    expect(joined).toContain("Яичница");
    expect(joined).toContain("Дают энергию");
    expect(joined).not.toContain("undefined");
    expect(joined).not.toContain("null");
  });

  test("completing a task persists across reload", async ({ page }) => {
    await page.goto("/daily");
    await dismissCheckIn(page);

    await page.locator(".task-card").nth(0).locator(".select-btn").click();

    const firstBtn = page.locator(".task-card").nth(0).locator(".select-btn");
    await expect(firstBtn).toBeDisabled();

    await page.reload();

    await expect(page.locator(".task-card").nth(0).locator(".select-btn")).toBeDisabled();
  });

  test("completion survives a locale switch (same stable task id)", async ({
    page,
  }) => {
    await page.goto("/daily");
    await dismissCheckIn(page);

    await page.locator(".task-card").nth(1).locator(".select-btn").click();
    await expect(page.locator(".task-card").nth(1).locator(".select-btn")).toBeDisabled();

    await setLocale(page, "uk");
    await page.reload();

    await expect(page.locator(".task-card").nth(1).locator(".task-title")).toHaveText("Медитація");
    await expect(page.locator(".task-card").nth(1).locator(".select-btn")).toBeDisabled();
  });

  test("writes a stable task id (not translation id) on completion", async ({
    page,
  }) => {
    const taskIds: string[] = [];

    await page.route("**/rest/v1/daily_task_completions", async (route) => {
      if (route.request().method() === "POST") {
        const body = route.request().postDataJSON();
        taskIds.push(body?.task_id ?? "");
      }
      await route.continue();
    });

    await page.goto("/daily");
    await dismissCheckIn(page);
    await page.locator(".task-card").nth(2).locator(".select-btn").click();

    await expect
      .poll(() => taskIds.length, { message: "waiting for completion POST" })
      .toBeGreaterThan(0);

    expect(taskIds[0]).toBe("task-3");
    expect(taskIds[0]).not.toMatch(/translation/i);
    expect(taskIds[0]).not.toMatch(/^uk-/);
  });
});

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
  await page.context().addCookies([{ ...LOCALE_COOKIE, value: locale }]);
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

/** Open the details dialog for the n-th task card. */
async function openTaskDialog(page: any, index: number) {
  await page.locator(".task-card").nth(index).click();
  const dialog = page.locator(".dialog");
  await expect(dialog).toBeVisible({ timeout: 10000 });
  return dialog;
}

/**
 * Complete a physical task: the dialog has a two-step flow
 * (ready → practice → complete). The reward dialog opens afterwards.
 */
async function completePhysicalTask(page: any, index = 2) {
  const dialog = await openTaskDialog(page, index);
  await dialog.locator(".complete-btn").click();
  await dialog.locator(".complete-btn").click();
}

/** Close the reward dialog via its close button (non-food tasks). */
async function dismissReward(page: any) {
  const reward = page.locator(".reward-dialog");
  await expect(reward).toBeVisible({ timeout: 10000 });
  await reward.locator(".reward-close").click();
  await expect(reward).toBeHidden();
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
    await expect(
      page.locator(".task-card").nth(0).locator(".task-title")
    ).toHaveText("Завтрак");
    await expect(
      page.locator(".task-card").nth(1).locator(".task-title")
    ).toHaveText("Медитация");
    await expect(
      page.locator(".task-card").nth(2).locator(".task-title")
    ).toHaveText("Прогулка");
  });

  test("renders Ukrainian translations when locale is uk", async ({ page }) => {
    await setLocale(page, "uk");
    await page.goto("/daily");

    await expect(page.locator(".task-card")).toHaveCount(3, { timeout: 20000 });
    await expect(
      page.locator(".task-card").nth(0).locator(".task-title")
    ).toHaveText("Сніданок");
    await expect(
      page.locator(".task-card").nth(1).locator(".task-title")
    ).toHaveText("Медитація");
    await expect(
      page.locator(".task-card").nth(2).locator(".task-title")
    ).toHaveText("Прогулянка");
  });

  test("switching locale reloads translated tasks without a fresh auth session", async ({
    page,
  }) => {
    await page.goto("/daily");
    await expect(
      page.locator(".task-card").nth(0).locator(".task-title")
    ).toHaveText("Завтрак", { timeout: 20000 });

    await setLocale(page, "uk");
    await page.reload();

    await expect(page.locator(".task-card")).toHaveCount(3, { timeout: 20000 });
    await expect(
      page.locator(".task-card").nth(0).locator(".task-title")
    ).toHaveText("Сніданок");
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

    await completePhysicalTask(page, 2);
    await dismissReward(page);

    await expect(
      page.locator(".task-card").nth(2).locator(".task-status")
    ).toHaveText("Готово");

    await page.reload();

    await expect(
      page.locator(".task-card").nth(2).locator(".task-status")
    ).toHaveText("Готово");
  });

  test("completion survives a locale switch (same stable task id)", async ({
    page,
  }) => {
    await page.goto("/daily");
    await dismissCheckIn(page);

    await openTaskDialog(page, 0);
    await page.locator(".dialog .complete-btn").click();

    await expect(
      page.locator(".task-card").nth(0).locator(".task-status")
    ).toHaveText("Готово");

    await setLocale(page, "uk");
    await page.reload();

    await expect(
      page.locator(".task-card").nth(0).locator(".task-title")
    ).toHaveText("Сніданок");
    await expect(
      page.locator(".task-card").nth(0).locator(".task-status")
    ).toBeVisible();
  });

  test("writes a stable task id (not translation id) on completion", async ({
    page,
  }) => {
    const taskIds: string[] = [];

    await page.route("**/rest/v1/daily_task_completions", async (route) => {
      if (route.request().method() === "POST") {
        taskIds.push(route.request().postDataJSON()?.task_id ?? "");
      }
      // fallback (not continue) so the request still reaches the supabase mock.
      await route.fallback();
    });

    await page.goto("/daily");
    await dismissCheckIn(page);
    await completePhysicalTask(page, 2);

    await expect
      .poll(() => taskIds.length, { message: "waiting for completion POST" })
      .toBeGreaterThan(0);

    expect(taskIds[0]).toBe("task-3");
    expect(taskIds[0]).not.toMatch(/translation/i);
    expect(taskIds[0]).not.toMatch(/^uk-/);
  });

  test("mental task completes through the feedback step and records the improvement", async ({
    page,
  }) => {
    const completions: Array<Record<string, unknown>> = [];

    await page.route("**/rest/v1/daily_task_completions", async (route) => {
      if (route.request().method() === "POST") {
        completions.push(route.request().postDataJSON());
      }
      await route.fallback();
    });

    await page.goto("/daily");
    await dismissCheckIn(page);

    const dialog = await openTaskDialog(page, 1);

    await dialog.locator(".complete-btn").click(); // start → practice
    await dialog.locator(".complete-btn").click(); // practice → feedback

    await expect(dialog.locator(".feedback-options")).toBeVisible();
    await dialog.locator(".feedback-options .q-radio").first().click();

    await dialog.locator(".complete-btn").click(); // confirm + award

    const reward = page.locator(".reward-dialog");
    await expect(reward).toBeVisible({ timeout: 10000 });
    await expect(reward.locator(".reward-energy")).toHaveText("+10 энергии");

    await expect
      .poll(() => completions.length, { message: "waiting for feedback POST" })
      .toBeGreaterThan(0);

    expect(completions[0].task_id).toBe("task-2");
    expect(completions[0].feedback).toBe("mood");
  });

  test("food task can be undone from the reward dialog", async ({ page }) => {
    await page.goto("/daily");
    await dismissCheckIn(page);

    await openTaskDialog(page, 0);
    await page.locator(".dialog .complete-btn").click();

    const reward = page.locator(".reward-dialog");
    await expect(reward).toBeVisible({ timeout: 10000 });
    await expect(reward.locator(".reward-undo")).toBeVisible();

    await reward.locator(".reward-undo .q-btn").click();

    await expect(reward).toBeHidden();
    await expect(
      page.locator(".task-card").nth(0).locator(".task-status")
    ).toHaveCount(0);

    const dialog = await openTaskDialog(page, 0);
    await expect(dialog.locator(".complete-btn")).toBeVisible();
  });
});

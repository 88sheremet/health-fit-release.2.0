import { expect, test, type Page } from "@playwright/test";
import { mockNotificationSettings } from "./helpers/supabase-mock";

const LOCALE_COOKIE = {
  name: "i18n_locale",
  domain: "localhost",
  path: "/",
};

const SAVED_SETTINGS = {
  user_id: "test-user-id",
  enabled: false,
  reminder_time: "07:05:00+00",
  days_of_week: [1, 2, 3, 4, 5, 6],
  timezone: "Europe/Kyiv",
  updated_at: "2026-01-01T00:00:00.000Z",
};

async function setLocale(page: Page, locale: "ru" | "uk") {
  await page.context().addCookies([{ ...LOCALE_COOKIE, value: locale }]);
}

test.describe("Settings — push notifications", () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, "ru");
  });

  test("loads the saved schedule from Supabase", async ({ page }) => {
    await mockNotificationSettings(page, { settings: SAVED_SETTINGS });

    await page.goto("/settings");

    await expect(page.locator(".notification-toggle")).toBeVisible({
      timeout: 20000,
    });
    await expect(page.locator(".schedule-fields input[type=time]")).toHaveValue(
      "07:05",
    );
    await expect(page.locator(".timezone-info")).toContainText("Europe/Kyiv");
    await expect(page.locator(".day-btn")).toHaveCount(7);
  });

  test("saves schedule with unique sorted days", async ({ page }) => {
    const saved: any[] = [];

    await mockNotificationSettings(page, {
      settings: SAVED_SETTINGS,
      onSave: (row) => saved.push(row),
    });

    await page.goto("/settings");
    await expect(page.locator(".notification-toggle")).toBeVisible({
      timeout: 20000,
    });

    await page.locator(".schedule-fields input[type=time]").fill("06:45");
    await page.locator(".day-btn").filter({ hasText: "Пн" }).click();
    await page.locator(".day-btn").filter({ hasText: "Вс" }).click();

    await page.locator(".schedule-btn").click();

    await expect(page.locator(".q-notification")).toContainText(
      "Расписание сохранено",
      { timeout: 10000 },
    );
    await expect.poll(() => saved.length).toBe(1);

    expect(saved[0]).toEqual(
      expect.objectContaining({
        user_id: "test-user-id",
        enabled: false,
        reminder_time: "06:45",
        days_of_week: [2, 3, 4, 5, 6, 7],
        timezone: expect.any(String),
      }),
    );
  });

  test("shows an unsupported warning when the browser lacks Push APIs", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Reflect.deleteProperty(window, "PushManager");
      Reflect.deleteProperty(Navigator.prototype, "serviceWorker");
      Reflect.deleteProperty(navigator, "serviceWorker");
    });
    await mockNotificationSettings(page, { settings: SAVED_SETTINGS });

    await page.goto("/settings");

    await expect(page.locator(".notification-warning")).toContainText(
      "Твой браузер не поддерживает Push-уведомления",
      { timeout: 20000 },
    );
    await expect(page.locator(".notification-toggle")).toHaveCount(0);
  });

  test("shows a permission warning and reverts the toggle when denied", async ({
    page,
  }) => {
    await mockNotificationSettings(page, {
      settings: SAVED_SETTINGS,
      permission: "denied",
    });

    await page.goto("/settings");

    await expect(page.locator(".permission-warning")).toContainText(
      "Разрешение на уведомления заблокировано",
      { timeout: 20000 },
    );

    await page.locator(".notification-toggle .q-toggle").click();

    await expect(page.locator(".q-notification")).toContainText(
      "Не удалось изменить настройки уведомлений",
      { timeout: 10000 },
    );
    await expect(
      page.locator(".notification-toggle .q-toggle input"),
    ).not.toBeChecked();
  });

  test("renders Ukrainian notification labels", async ({ page }) => {
    await setLocale(page, "uk");
    await mockNotificationSettings(page, { settings: SAVED_SETTINGS });

    await page.goto("/settings");

    await expect(page.locator(".notification-toggle")).toBeVisible({
      timeout: 20000,
    });
    await expect(
      page.locator(".settings-card").nth(1).locator(".card-title"),
    ).toHaveText("Push-сповіщення");
    await expect(page.locator(".day-btn").last()).toHaveText("Нд");
  });
});

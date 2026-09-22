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

test.describe("Menu page", () => {
  test("renders menu with 3 navigation tabs", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/menu");

    await expect(page.locator(".menu-page .title")).toBeVisible();
    await expect(page.locator(".tab-card")).toHaveCount(3);
  });

  test("daily tab navigates to /daily", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/menu");

    await page.locator(".tab-card").first().click();
    await expect(page).toHaveURL(/\/daily/, { timeout: 10000 });
  });

  test("weekly tab navigates to /weekly", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/menu");

    await page.locator(".tab-card").nth(1).click();
    await expect(page).toHaveURL(/\/weekly/, { timeout: 10000 });
  });

  test("journal tab navigates to /journal", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/menu");

    await page.locator(".tab-card").nth(2).click();
    await expect(page).toHaveURL(/\/journal/, { timeout: 10000 });
  });
});

test.describe("Daily page", () => {
  test("renders greeting header and energy card", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/daily");

    await expect(page.locator(".page .header")).toBeVisible();
    await expect(page.locator(".energy-card")).toBeVisible();
  });

  test("shows streak badge", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/daily");

    await expect(page.locator(".streak-avatar")).toBeVisible();
  });

  test("shows energy value", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/daily");

    await expect(page.locator(".energy-card .value")).toBeVisible();
  });
});

test.describe("Weekly page", () => {
  test.beforeEach(async ({ page }) => {
    await freezeDateToMonday(page);
    await mockScreeningCompleted(page);
    await setLocale(page, "ru");
  });

  test("renders weekly task card with Russian title", async ({ page }) => {
    await page.goto("/weekly");

    await expect(page.locator(".page .title")).toBeVisible();
    await expect(page.locator(".task-card")).toBeVisible();
    await expect(page.locator(".task-title")).toHaveText(
      "Дыхательная практика"
    );
  });

  test("shows week number and day", async ({ page }) => {
    await page.goto("/weekly");

    await expect(page.locator(".subtitle").first()).toBeVisible();
    await expect(page.locator(".week-day")).toBeVisible();
  });

  test("renders Ukrainian title when locale is uk", async ({ page }) => {
    await setLocale(page, "uk");
    await page.goto("/weekly");

    await expect(page.locator(".task-card")).toBeVisible({ timeout: 20000 });
    await expect(page.locator(".task-title")).toHaveText("Дихальна практика");
  });

  test("switching locale reloads translated task title", async ({ page }) => {
    await page.goto("/weekly");
    await expect(page.locator(".task-title")).toHaveText(
      "Дыхательная практика",
      {
        timeout: 20000,
      }
    );

    await setLocale(page, "uk");
    await page.reload();

    await expect(page.locator(".task-title")).toHaveText("Дихальна практика");
  });
});

test.describe("Journal page", () => {
  test("renders journal hero and 3 action cards", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/journal");

    await expect(page.locator(".hero-title")).toBeVisible();
    await expect(page.locator(".action-card")).toHaveCount(3);
  });

  test("chart action navigates to /journal-chart", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/journal");

    await page.locator(".action-card").first().click();
    await expect(page).toHaveURL(/\/journal-chart/, { timeout: 10000 });
  });

  test("archive action navigates to /journal-archive", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/journal");

    await page.locator(".action-card").nth(2).click();
    await expect(page).toHaveURL(/\/journal-archive/, { timeout: 10000 });
  });

  test("note action opens dialog", async ({ page }) => {
    await mockScreeningCompleted(page);
    await page.goto("/journal");

    await page.locator(".note-card").click();
    await expect(page.locator(".dialog-card")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Navigation guard", () => {
  test("unauthenticated user is redirected to /login", async ({ page }) => {
    await page.goto("/daily");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});

import { test, expect } from "@playwright/test";
import { mockSupabaseAuth, mockSupabaseNoSession, seedSupabaseSession } from "./helpers/supabase-mock";

const MOCK_USER_REF = {
  id: "test-user-id",
  email: "test@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2026-01-01T00:00:00Z",
};

test.describe("Login page", () => {
  test("renders login form with heading and inputs", async ({ page }) => {
    await mockSupabaseNoSession(page);
    await page.goto("/login");

    await expect(page.locator(".login-card h1")).toBeVisible();
    await expect(page.locator(".login-card")).toBeVisible();
    await expect(page.locator(".login-card button[type='submit']")).toBeVisible();
  });

  test("shows error on empty submit", async ({ page }) => {
    await mockSupabaseNoSession(page);
    await page.goto("/login");
    await page.locator(".login-card button[type='submit']").click();

    await expect(page.locator(".login-error")).toHaveText("Введите email и пароль");
  });

  test("shows error on wrong credentials", async ({ page }) => {
    await mockSupabaseNoSession(page);
    await page.goto("/login");

    await page.getByRole("textbox", { name: /email/i }).fill("bad@example.com");
    await page.getByRole("textbox", { name: /пароль/i }).fill("wrongpassword");
    await page.locator(".login-card button[type='submit']").click();

    await expect(page.locator(".login-error")).toHaveText("Invalid login credentials");
  });

  test("navigates to daily on successful login when screening exists", async ({ page }) => {
    const MOCK_SESSION_OBJ = {
      access_token: "tok",
      refresh_token: "ref",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 86400,
      token_type: "bearer",
      user: MOCK_USER_REF,
    };

    await page.route("**/*.supabase.co/**", (route, request) => {
      const url = request.url();
      const method = request.method();

      if (url.includes("/auth/v1/token") && method === "POST") {
        return route.fulfill({
          status: 200,
          json: {
            access_token: MOCK_SESSION_OBJ.access_token,
            refresh_token: MOCK_SESSION_OBJ.refresh_token,
            expires_in: MOCK_SESSION_OBJ.expires_in,
            expires_at: MOCK_SESSION_OBJ.expires_at,
            token_type: MOCK_SESSION_OBJ.token_type,
            user: MOCK_USER_REF,
          },
        });
      }
      if (url.includes("/auth/v1/user")) {
        return route.fulfill({ status: 200, json: { user: null } });
      }
      if (url.includes("/auth/v1/session")) {
        return route.fulfill({ status: 200, json: { session: MOCK_SESSION_OBJ } });
      }
      if (url.includes("/rest/v1/screening_results")) {
        return route.fulfill({
          status: 200,
          json: [{ id: "sr-1", user_id: MOCK_USER_REF.id }],
          headers: { "content-type": "application/json" },
        });
      }
      if (url.includes("/rest/v1/")) {
        return route.fulfill({ status: 200, json: [], headers: { "content-type": "application/json" } });
      }
      return route.fallback();
    });

    await page.goto("/login");

    await expect(page.locator(".login-card")).toBeVisible({ timeout: 15000 });

    await page.getByRole("textbox", { name: /email/i }).fill("test@example.com");
    await page.getByRole("textbox", { name: /пароль/i }).fill("password123");
    await page.locator(".login-card button[type='submit']").click();

    await expect(page).toHaveURL(/\/daily/, { timeout: 15000 });
  });

  test("has link to register page", async ({ page }) => {
    await mockSupabaseNoSession(page);
    await page.goto("/login");

    await expect(page.locator('.login-links a[href="/register"]')).toBeVisible();
  });

  test("has link to forgot password", async ({ page }) => {
    await mockSupabaseNoSession(page);
    await page.goto("/login");

    await expect(page.locator('.login-links a[href="/forgot-password"]')).toBeVisible();
  });
});

test.describe("Register page", () => {
  test("renders registration form", async ({ page }) => {
    await mockSupabaseNoSession(page);
    await page.goto("/register");

    await expect(page.locator(".register-card h1")).toBeVisible();
    await expect(page.locator(".register-card")).toBeVisible();
  });

  test("shows error on empty submit", async ({ page }) => {
    await mockSupabaseNoSession(page);
    await page.goto("/register");
    await page.locator(".register-card button.bg-primary").click();

    await expect(page.locator(".register-error")).toHaveText("Заполните все поля");
  });

  test("shows error on short password", async ({ page }) => {
    await mockSupabaseNoSession(page);
    await page.goto("/register");

    await page.getByRole("textbox", { name: /email/i }).fill("user@example.com");
    await page.getByRole("textbox", { name: /^Пароль$/ }).fill("123");
    await page.getByRole("textbox", { name: /повторите пароль/i }).fill("123");
    await page.locator(".register-card button.bg-primary").click();

    await expect(page.locator(".register-error")).toHaveText(
      "Пароль должен содержать минимум 6 символов",
    );
  });

  test("shows error on password mismatch", async ({ page }) => {
    await mockSupabaseNoSession(page);
    await page.goto("/register");

    await page.getByRole("textbox", { name: /email/i }).fill("user@example.com");
    await page.getByRole("textbox", { name: /^Пароль$/ }).fill("123456");
    await page.getByRole("textbox", { name: /повторите пароль/i }).fill("654321");
    await page.locator(".register-card button.bg-primary").click();

    await expect(page.locator(".register-error")).toHaveText("Пароли не совпадают");
  });

  test("has link back to login", async ({ page }) => {
    await mockSupabaseNoSession(page);
    await page.goto("/register");

    await expect(page.locator('.register-links a[href="/login"]')).toBeVisible();
  });
});

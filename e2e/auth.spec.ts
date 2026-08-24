import { test, expect } from "@playwright/test";
import { mockSupabaseAuth, mockSupabaseNoSession } from "./helpers/supabase-mock";

test.describe("Login page", () => {
  test("renders login form", async ({ page }) => {
    await mockSupabaseNoSession(page);
    await page.goto("/login");

    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("shows error on empty submit", async ({ page }) => {
    await mockSupabaseNoSession(page);
    await page.goto("/login");
    await page.locator('button[type="submit"]').click();

    await expect(page.locator(".login-error")).toBeVisible();
  });

  test("shows error on invalid email", async ({ page }) => {
    await mockSupabaseNoSession(page);
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("notanemail");
    await page.locator('input[type="password"]').fill("123456");
    await page.locator('button[type="submit"]').click();

    await expect(page.locator(".login-error")).toBeVisible();
  });

  test("shows error on wrong credentials", async ({ page }) => {
    await mockSupabaseNoSession(page);
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("bad@example.com");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.locator('button[type="submit"]').click();

    await expect(page.locator(".login-error")).toBeVisible();
  });

  test("navigates to daily on successful login (existing user)", async ({ page }) => {
    await mockSupabaseAuth(page, {
      user: {
        id: "test-user-id",
        email: "test@example.com",
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: "2026-01-01T00:00:00Z",
      },
    });

    // Mock screening exists
    await page.route("**/*.supabase.co/rest/v1/screening_results**", (route) =>
      route.fulfill({
        status: 200,
        json: { id: "sr-1", user_id: "test-user-id" },
        headers: { "content-type": "application/json" },
      }),
    );

    await page.goto("/login");
    await page.locator('input[type="email"]').fill("test@example.com");
    await page.locator('input[type="password"]').fill("password123");
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/daily/);
  });

  test("has link to register page", async ({ page }) => {
    await mockSupabaseNoSession(page);
    await page.goto("/login");

    const registerLink = page.locator('a[href="/register"]');
    await expect(registerLink).toBeVisible();
  });

  test("has link to forgot password", async ({ page }) => {
    await mockSupabaseNoSession(page);
    await page.goto("/login");

    const forgotLink = page.locator('a[href="/forgot-password"]');
    await expect(forgotLink).toBeVisible();
  });
});

test.describe("Register page", () => {
  test("renders registration form", async ({ page }) => {
    await mockSupabaseNoSession(page);
    await page.goto("/register");

    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    const passwordInputs = page.locator('input[type="password"]');
    await expect(passwordInputs).toHaveCount(2);
    await expect(page.locator('button:has-text("Register"), button:has-text("Зарегистрироваться")')).toBeVisible();
  });

  test("shows error on empty submit", async ({ page }) => {
    await mockSupabaseNoSession(page);
    await page.goto("/register");
    await page.locator('button:has-text("Register"), button:has-text("Зарегистрироваться")').click();

    await expect(page.locator(".register-error")).toBeVisible();
  });

  test("shows error on short password", async ({ page }) => {
    await mockSupabaseNoSession(page);
    await page.goto("/register");
    await page.locator('input[type="email"]').fill("user@example.com");
    await page.locator('input[type="password"]').fill("123");
    const confirmInput = page.locator('input[type="password"]').nth(1);
    await confirmInput.fill("123");
    await page.locator('button:has-text("Register"), button:has-text("Зарегистрироваться")').click();

    await expect(page.locator(".register-error")).toBeVisible();
  });

  test("shows error on password mismatch", async ({ page }) => {
    await mockSupabaseNoSession(page);
    await page.goto("/register");
    await page.locator('input[type="email"]').fill("user@example.com");
    await page.locator('input[type="password"]').fill("123456");
    const confirmInput = page.locator('input[type="password"]').nth(1);
    await confirmInput.fill("654321");
    await page.locator('button:has-text("Register"), button:has-text("Зарегистрироваться")').click();

    await expect(page.locator(".register-error")).toBeVisible();
  });

  test("has link back to login", async ({ page }) => {
    await mockSupabaseNoSession(page);
    await page.goto("/register");

    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink).toBeVisible();
  });
});

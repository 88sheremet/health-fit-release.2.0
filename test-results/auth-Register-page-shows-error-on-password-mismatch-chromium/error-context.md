# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Register page >> shows error on password mismatch
- Location: e2e\auth.spec.ts:121:3

# Error details

```
Error: locator.fill: Error: strict mode violation: locator('input[type="password"]') resolved to 2 elements:
    1) <input value="" tabindex="0" type="password" aria-label="Пароль" autocomplete="new-password" class="q-field__native q-placeholder" id="f_db1b0e87-0033-4729-9959-00caece2face"/> aka getByRole('textbox', { name: 'Пароль', exact: true })
    2) <input value="" tabindex="0" type="password" autocomplete="new-password" aria-label="Повторите пароль" class="q-field__native q-placeholder" id="f_07285854-5f94-400e-9fbc-ed17b1daaa6e"/> aka getByRole('textbox', { name: 'Повторите пароль' })

Call log:
  - waiting for locator('input[type="password"]')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e4]:
    - heading "Регистрация" [level=1] [ref=e5]
    - generic [ref=e9]:
      - generic: Email
      - textbox "Email" [active] [ref=e10]: user@example.com
    - generic [ref=e14]:
      - generic: Пароль
      - textbox "Пароль" [ref=e15]
    - generic [ref=e19]:
      - generic: Повторите пароль
      - textbox "Повторите пароль" [ref=e20]
    - button "Зарегистрироваться" [ref=e21] [cursor=pointer]
    - generic [ref=e24]:
      - generic [ref=e25]: Уже есть аккаунт?
      - link "Войти" [ref=e26] [cursor=pointer]:
        - /url: /login
  - generic [ref=e27]:
    - button "Toggle Nuxt DevTools" [ref=e28] [cursor=pointer]
    - generic "Page load time" [ref=e32]:
      - generic [ref=e33]: "65"
      - generic [ref=e34]: ms
    - button "Toggle Component Inspector" [ref=e36] [cursor=pointer]
```

# Test source

```ts
  25  |     await page.goto("/login");
  26  |     await page.locator('input[type="email"]').fill("notanemail");
  27  |     await page.locator('input[type="password"]').fill("123456");
  28  |     await page.locator('button[type="submit"]').click();
  29  | 
  30  |     await expect(page.locator(".login-error")).toBeVisible();
  31  |   });
  32  | 
  33  |   test("shows error on wrong credentials", async ({ page }) => {
  34  |     await mockSupabaseNoSession(page);
  35  |     await page.goto("/login");
  36  |     await page.locator('input[type="email"]').fill("bad@example.com");
  37  |     await page.locator('input[type="password"]').fill("wrongpassword");
  38  |     await page.locator('button[type="submit"]').click();
  39  | 
  40  |     await expect(page.locator(".login-error")).toBeVisible();
  41  |   });
  42  | 
  43  |   test("navigates to daily on successful login (existing user)", async ({ page }) => {
  44  |     await mockSupabaseAuth(page, {
  45  |       user: {
  46  |         id: "test-user-id",
  47  |         email: "test@example.com",
  48  |         app_metadata: {},
  49  |         user_metadata: {},
  50  |         aud: "authenticated",
  51  |         created_at: "2026-01-01T00:00:00Z",
  52  |       },
  53  |     });
  54  | 
  55  |     // Mock screening exists
  56  |     await page.route("**/*.supabase.co/rest/v1/screening_results**", (route) =>
  57  |       route.fulfill({
  58  |         status: 200,
  59  |         json: { id: "sr-1", user_id: "test-user-id" },
  60  |         headers: { "content-type": "application/json" },
  61  |       }),
  62  |     );
  63  | 
  64  |     await page.goto("/login");
  65  |     await page.locator('input[type="email"]').fill("test@example.com");
  66  |     await page.locator('input[type="password"]').fill("password123");
  67  |     await page.locator('button[type="submit"]').click();
  68  | 
  69  |     await expect(page).toHaveURL(/\/daily/);
  70  |   });
  71  | 
  72  |   test("has link to register page", async ({ page }) => {
  73  |     await mockSupabaseNoSession(page);
  74  |     await page.goto("/login");
  75  | 
  76  |     const registerLink = page.locator('a[href="/register"]');
  77  |     await expect(registerLink).toBeVisible();
  78  |   });
  79  | 
  80  |   test("has link to forgot password", async ({ page }) => {
  81  |     await mockSupabaseNoSession(page);
  82  |     await page.goto("/login");
  83  | 
  84  |     const forgotLink = page.locator('a[href="/forgot-password"]');
  85  |     await expect(forgotLink).toBeVisible();
  86  |   });
  87  | });
  88  | 
  89  | test.describe("Register page", () => {
  90  |   test("renders registration form", async ({ page }) => {
  91  |     await mockSupabaseNoSession(page);
  92  |     await page.goto("/register");
  93  | 
  94  |     await expect(page.locator("h1")).toBeVisible();
  95  |     await expect(page.locator('input[type="email"]')).toBeVisible();
  96  |     const passwordInputs = page.locator('input[type="password"]');
  97  |     await expect(passwordInputs).toHaveCount(2);
  98  |     await expect(page.locator('button:has-text("Register"), button:has-text("Зарегистрироваться")')).toBeVisible();
  99  |   });
  100 | 
  101 |   test("shows error on empty submit", async ({ page }) => {
  102 |     await mockSupabaseNoSession(page);
  103 |     await page.goto("/register");
  104 |     await page.locator('button:has-text("Register"), button:has-text("Зарегистрироваться")').click();
  105 | 
  106 |     await expect(page.locator(".register-error")).toBeVisible();
  107 |   });
  108 | 
  109 |   test("shows error on short password", async ({ page }) => {
  110 |     await mockSupabaseNoSession(page);
  111 |     await page.goto("/register");
  112 |     await page.locator('input[type="email"]').fill("user@example.com");
  113 |     await page.locator('input[type="password"]').fill("123");
  114 |     const confirmInput = page.locator('input[type="password"]').nth(1);
  115 |     await confirmInput.fill("123");
  116 |     await page.locator('button:has-text("Register"), button:has-text("Зарегистрироваться")').click();
  117 | 
  118 |     await expect(page.locator(".register-error")).toBeVisible();
  119 |   });
  120 | 
  121 |   test("shows error on password mismatch", async ({ page }) => {
  122 |     await mockSupabaseNoSession(page);
  123 |     await page.goto("/register");
  124 |     await page.locator('input[type="email"]').fill("user@example.com");
> 125 |     await page.locator('input[type="password"]').fill("123456");
      |                                                  ^ Error: locator.fill: Error: strict mode violation: locator('input[type="password"]') resolved to 2 elements:
  126 |     const confirmInput = page.locator('input[type="password"]').nth(1);
  127 |     await confirmInput.fill("654321");
  128 |     await page.locator('button:has-text("Register"), button:has-text("Зарегистрироваться")').click();
  129 | 
  130 |     await expect(page.locator(".register-error")).toBeVisible();
  131 |   });
  132 | 
  133 |   test("has link back to login", async ({ page }) => {
  134 |     await mockSupabaseNoSession(page);
  135 |     await page.goto("/register");
  136 | 
  137 |     const loginLink = page.locator('a[href="/login"]');
  138 |     await expect(loginLink).toBeVisible();
  139 |   });
  140 | });
  141 | 
```
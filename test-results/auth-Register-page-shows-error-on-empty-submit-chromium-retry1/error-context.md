# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Register page >> shows error on empty submit
- Location: e2e\auth.spec.ts:123:3

# Error details

```
Error: locator.click: Error: strict mode violation: locator('.register-card button') resolved to 2 elements:
    1) <button tabindex="0" type="button" data-v-5807bfac="" class="q-btn q-btn-item non-selectable no-outline q-btn--unelevated q-btn--rectangle bg-primary text-white q-btn--actionable q-focusable q-hoverable full-width">…</button> aka getByRole('button', { name: 'Зарегистрироваться', exact: true })
    2) <button tabindex="0" type="button" data-v-5807bfac="" class="q-btn q-btn-item non-selectable no-outline q-btn--unelevated q-btn--rectangle q-btn--actionable q-focusable q-hoverable q-btn--no-uppercase google-btn full-width">…</button> aka getByRole('button', { name: 'G Зарегистрироваться через' })

Call log:
  - waiting for locator('.register-card button')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - heading "Регистрация" [level=1] [ref=e5]
    - generic [ref=e9]:
      - generic: Email
      - textbox "Email" [ref=e10]
    - generic [ref=e14]:
      - generic: Пароль
      - textbox "Пароль" [ref=e15]
    - generic [ref=e19]:
      - generic: Повторите пароль
      - textbox "Повторите пароль" [ref=e20]
    - button "Зарегистрироваться" [ref=e21] [cursor=pointer]
    - generic [ref=e24]: или
    - button "G Зарегистрироваться через Google" [ref=e26] [cursor=pointer]:
      - generic [ref=e27]:
        - generic [ref=e28]: G
        - generic [ref=e29]: Зарегистрироваться через Google
    - generic [ref=e30]:
      - generic [ref=e31]: Уже есть аккаунт?
      - link "Войти" [ref=e32] [cursor=pointer]:
        - /url: /login
  - generic [ref=e33]:
    - button "Toggle Nuxt DevTools" [ref=e34] [cursor=pointer]
    - generic "Page load time" [ref=e38]:
      - generic [ref=e39]: "48"
      - generic [ref=e40]: ms
    - button "Toggle Component Inspector" [ref=e42] [cursor=pointer]
```

# Test source

```ts
  26  |     await page.locator(".login-card button[type='submit']").click();
  27  | 
  28  |     await expect(page.locator(".login-error")).toHaveText("Введите email и пароль");
  29  |   });
  30  | 
  31  |   test("shows error on wrong credentials", async ({ page }) => {
  32  |     await mockSupabaseNoSession(page);
  33  |     await page.goto("/login");
  34  | 
  35  |     await page.getByRole("textbox", { name: /email/i }).fill("bad@example.com");
  36  |     await page.getByRole("textbox", { name: /пароль/i }).fill("wrongpassword");
  37  |     await page.locator(".login-card button[type='submit']").click();
  38  | 
  39  |     await expect(page.locator(".login-error")).toHaveText("Invalid login credentials");
  40  |   });
  41  | 
  42  |   test("navigates to daily on successful login when screening exists", async ({ page }) => {
  43  |     const MOCK_SESSION_OBJ = {
  44  |       access_token: "tok",
  45  |       refresh_token: "ref",
  46  |       expires_in: 3600,
  47  |       expires_at: Math.floor(Date.now() / 1000) + 86400,
  48  |       token_type: "bearer",
  49  |       user: MOCK_USER_REF,
  50  |     };
  51  | 
  52  |     await page.route("**/*.supabase.co/**", (route, request) => {
  53  |       const url = request.url();
  54  |       const method = request.method();
  55  | 
  56  |       if (url.includes("/auth/v1/token") && method === "POST") {
  57  |         return route.fulfill({
  58  |           status: 200,
  59  |           json: {
  60  |             access_token: MOCK_SESSION_OBJ.access_token,
  61  |             refresh_token: MOCK_SESSION_OBJ.refresh_token,
  62  |             expires_in: MOCK_SESSION_OBJ.expires_in,
  63  |             expires_at: MOCK_SESSION_OBJ.expires_at,
  64  |             token_type: MOCK_SESSION_OBJ.token_type,
  65  |             user: MOCK_USER_REF,
  66  |           },
  67  |         });
  68  |       }
  69  |       if (url.includes("/auth/v1/user")) {
  70  |         return route.fulfill({ status: 200, json: { user: null } });
  71  |       }
  72  |       if (url.includes("/auth/v1/session")) {
  73  |         return route.fulfill({ status: 200, json: { session: MOCK_SESSION_OBJ } });
  74  |       }
  75  |       if (url.includes("/rest/v1/screening_results")) {
  76  |         return route.fulfill({
  77  |           status: 200,
  78  |           json: [{ id: "sr-1", user_id: MOCK_USER_REF.id }],
  79  |           headers: { "content-type": "application/json" },
  80  |         });
  81  |       }
  82  |       if (url.includes("/rest/v1/")) {
  83  |         return route.fulfill({ status: 200, json: [], headers: { "content-type": "application/json" } });
  84  |       }
  85  |       return route.fallback();
  86  |     });
  87  | 
  88  |     await page.goto("/login");
  89  | 
  90  |     await expect(page.locator(".login-card")).toBeVisible({ timeout: 15000 });
  91  | 
  92  |     await page.getByRole("textbox", { name: /email/i }).fill("test@example.com");
  93  |     await page.getByRole("textbox", { name: /пароль/i }).fill("password123");
  94  |     await page.locator(".login-card button[type='submit']").click();
  95  | 
  96  |     await expect(page).toHaveURL(/\/daily/, { timeout: 15000 });
  97  |   });
  98  | 
  99  |   test("has link to register page", async ({ page }) => {
  100 |     await mockSupabaseNoSession(page);
  101 |     await page.goto("/login");
  102 | 
  103 |     await expect(page.locator('.login-links a[href="/register"]')).toBeVisible();
  104 |   });
  105 | 
  106 |   test("has link to forgot password", async ({ page }) => {
  107 |     await mockSupabaseNoSession(page);
  108 |     await page.goto("/login");
  109 | 
  110 |     await expect(page.locator('.login-links a[href="/forgot-password"]')).toBeVisible();
  111 |   });
  112 | });
  113 | 
  114 | test.describe("Register page", () => {
  115 |   test("renders registration form", async ({ page }) => {
  116 |     await mockSupabaseNoSession(page);
  117 |     await page.goto("/register");
  118 | 
  119 |     await expect(page.locator(".register-card h1")).toBeVisible();
  120 |     await expect(page.locator(".register-card")).toBeVisible();
  121 |   });
  122 | 
  123 |   test("shows error on empty submit", async ({ page }) => {
  124 |     await mockSupabaseNoSession(page);
  125 |     await page.goto("/register");
> 126 |     await page.locator(".register-card button").click();
      |                                                 ^ Error: locator.click: Error: strict mode violation: locator('.register-card button') resolved to 2 elements:
  127 | 
  128 |     await expect(page.locator(".register-error")).toHaveText("Заполните все поля");
  129 |   });
  130 | 
  131 |   test("shows error on short password", async ({ page }) => {
  132 |     await mockSupabaseNoSession(page);
  133 |     await page.goto("/register");
  134 | 
  135 |     await page.getByRole("textbox", { name: /email/i }).fill("user@example.com");
  136 |     await page.getByRole("textbox", { name: /^Пароль$/ }).fill("123");
  137 |     await page.getByRole("textbox", { name: /повторите пароль/i }).fill("123");
  138 |     await page.locator(".register-card button").click();
  139 | 
  140 |     await expect(page.locator(".register-error")).toHaveText(
  141 |       "Пароль должен содержать минимум 6 символов",
  142 |     );
  143 |   });
  144 | 
  145 |   test("shows error on password mismatch", async ({ page }) => {
  146 |     await mockSupabaseNoSession(page);
  147 |     await page.goto("/register");
  148 | 
  149 |     await page.getByRole("textbox", { name: /email/i }).fill("user@example.com");
  150 |     await page.getByRole("textbox", { name: /^Пароль$/ }).fill("123456");
  151 |     await page.getByRole("textbox", { name: /повторите пароль/i }).fill("654321");
  152 |     await page.locator(".register-card button").click();
  153 | 
  154 |     await expect(page.locator(".register-error")).toHaveText("Пароли не совпадают");
  155 |   });
  156 | 
  157 |   test("has link back to login", async ({ page }) => {
  158 |     await mockSupabaseNoSession(page);
  159 |     await page.goto("/register");
  160 | 
  161 |     await expect(page.locator('.register-links a[href="/login"]')).toBeVisible();
  162 |   });
  163 | });
  164 | 
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: recovery.spec.ts >> Menu page >> daily tab navigates to /daily
- Location: e2e\recovery.spec.ts:14:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.tab-card').first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - heading "Вход" [level=1] [ref=e5]
    - generic [ref=e6]:
      - generic [ref=e10]:
        - generic: Email
        - textbox "Email" [ref=e11]
      - generic [ref=e15]:
        - generic: Пароль
        - textbox "Пароль" [ref=e16]
      - button "Войти" [ref=e17] [cursor=pointer]
    - generic [ref=e20]:
      - link "Регистрация" [ref=e21] [cursor=pointer]:
        - /url: /register
      - link "Забыли пароль?" [ref=e22] [cursor=pointer]:
        - /url: /forgot-password
  - generic [ref=e23]:
    - button "Toggle Nuxt DevTools" [ref=e24] [cursor=pointer]
    - generic "Page load time" [ref=e28]:
      - generic [ref=e29]: "315"
      - generic [ref=e30]: ms
    - button "Toggle Component Inspector" [ref=e32] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { mockScreeningCompleted } from "./helpers/supabase-mock";
  3   | 
  4   | test.describe("Menu page", () => {
  5   |   test("renders menu with navigation tabs", async ({ page }) => {
  6   |     await mockScreeningCompleted(page);
  7   |     await page.goto("/menu");
  8   | 
  9   |     await expect(page.locator(".title").first()).toBeVisible();
  10  |     await expect(page.locator(".tab-card").first()).toBeVisible();
  11  |     await expect(page.locator(".tab-card")).toHaveCount(3);
  12  |   });
  13  | 
  14  |   test("daily tab navigates to /daily", async ({ page }) => {
  15  |     await mockScreeningCompleted(page);
  16  |     await page.goto("/menu");
  17  | 
> 18  |     await page.locator(".tab-card").first().click();
      |                                             ^ Error: locator.click: Test timeout of 30000ms exceeded.
  19  |     await expect(page).toHaveURL(/\/daily/);
  20  |   });
  21  | 
  22  |   test("weekly tab navigates to /weekly", async ({ page }) => {
  23  |     await mockScreeningCompleted(page);
  24  |     await page.goto("/menu");
  25  | 
  26  |     await page.locator(".tab-card").nth(1).click();
  27  |     await expect(page).toHaveURL(/\/weekly/);
  28  |   });
  29  | 
  30  |   test("journal tab navigates to /journal", async ({ page }) => {
  31  |     await mockScreeningCompleted(page);
  32  |     await page.goto("/menu");
  33  | 
  34  |     await page.locator(".tab-card").nth(2).click();
  35  |     await expect(page).toHaveURL(/\/journal/);
  36  |   });
  37  | });
  38  | 
  39  | test.describe("Daily page", () => {
  40  |   test("renders greeting and energy card", async ({ page }) => {
  41  |     await mockScreeningCompleted(page);
  42  |     await page.goto("/daily");
  43  | 
  44  |     await expect(page.locator(".header").first()).toBeVisible();
  45  |     await expect(page.locator(".energy-card")).toBeVisible();
  46  |   });
  47  | 
  48  |   test("shows streak badge", async ({ page }) => {
  49  |     await mockScreeningCompleted(page);
  50  |     await page.goto("/daily");
  51  | 
  52  |     await expect(page.locator(".streak-avatar")).toBeVisible();
  53  |   });
  54  | 
  55  |   test("shows bottom navigation", async ({ page }) => {
  56  |     await mockScreeningCompleted(page);
  57  |     await page.goto("/daily");
  58  | 
  59  |     await expect(page.locator(".bottom-navigation, nav, [class*='bottom']").first()).toBeVisible();
  60  |   });
  61  | });
  62  | 
  63  | test.describe("Weekly page", () => {
  64  |   test("renders weekly task info", async ({ page }) => {
  65  |     await mockScreeningCompleted(page);
  66  |     await page.goto("/weekly");
  67  | 
  68  |     await expect(page.locator(".title").first()).toBeVisible();
  69  |     await expect(page.locator(".task-card")).toBeVisible();
  70  |   });
  71  | 
  72  |   test("shows week number and day", async ({ page }) => {
  73  |     await mockScreeningCompleted(page);
  74  |     await page.goto("/weekly");
  75  | 
  76  |     await expect(page.locator(".subtitle").first()).toBeVisible();
  77  |   });
  78  | });
  79  | 
  80  | test.describe("Journal page", () => {
  81  |   test("renders journal with actions", async ({ page }) => {
  82  |     await mockScreeningCompleted(page);
  83  |     await page.goto("/journal");
  84  | 
  85  |     await expect(page.locator(".hero-title, .title").first()).toBeVisible();
  86  |     await expect(page.locator(".action-card").first()).toBeVisible();
  87  |     await expect(page.locator(".action-card")).toHaveCount(3);
  88  |   });
  89  | 
  90  |   test("clicking chart action navigates to chart", async ({ page }) => {
  91  |     await mockScreeningCompleted(page);
  92  |     await page.goto("/journal");
  93  | 
  94  |     await page.locator(".action-card").first().click();
  95  |     await expect(page).toHaveURL(/\/journal-chart/);
  96  |   });
  97  | 
  98  |   test("clicking archive action navigates to archive", async ({ page }) => {
  99  |     await mockScreeningCompleted(page);
  100 |     await page.goto("/journal");
  101 | 
  102 |     await page.locator(".action-card").nth(2).click();
  103 |     await expect(page).toHaveURL(/\/journal-archive/);
  104 |   });
  105 | 
  106 |   test("note action opens dialog", async ({ page }) => {
  107 |     await mockScreeningCompleted(page);
  108 |     await page.goto("/journal");
  109 | 
  110 |     await page.locator(".note-card").click();
  111 |     await expect(page.locator(".dialog-card, [role='dialog']").first()).toBeVisible();
  112 |   });
  113 | });
  114 | 
  115 | test.describe("Navigation guard", () => {
  116 |   test("unauthenticated user is redirected to /login", async ({ page }) => {
  117 |     await page.goto("/daily");
  118 |     await expect(page).toHaveURL(/\/login/);
```
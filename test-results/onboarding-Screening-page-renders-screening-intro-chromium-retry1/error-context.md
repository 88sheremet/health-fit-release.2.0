# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: onboarding.spec.ts >> Screening page >> renders screening intro
- Location: e2e\onboarding.spec.ts:26:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.title').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.title').first()

```

```yaml
- heading "Вход" [level=1]
- text: Email
- textbox "Email"
- text: Пароль
- textbox "Пароль"
- button "Войти"
- link "Регистрация":
  - /url: /register
- link "Забыли пароль?":
  - /url: /forgot-password
- img
- button "Toggle Nuxt DevTools":
  - img
- text: 116 ms
- button "Toggle Component Inspector":
  - img
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { mockSupabaseAuth, mockScreeningCompleted } from "./helpers/supabase-mock";
  3   | 
  4   | test.describe("Welcome page", () => {
  5   |   test("renders welcome content", async ({ page }) => {
  6   |     await mockSupabaseAuth(page);
  7   |     await page.goto("/welcome");
  8   | 
  9   |     await expect(page.locator(".title, h1").first()).toBeVisible();
  10  |     await expect(page.locator(".start-btn, .hero-icon").first()).toBeVisible();
  11  |   });
  12  | 
  13  |   test("has start button that navigates to screening", async ({ page }) => {
  14  |     await mockSupabaseAuth(page);
  15  |     await page.goto("/welcome");
  16  | 
  17  |     const startBtn = page.locator(".start-btn, button:has-text('Start'), button:has-text('Начать')").first();
  18  |     await expect(startBtn).toBeVisible();
  19  |     await startBtn.click();
  20  | 
  21  |     await expect(page).toHaveURL(/\/screening/);
  22  |   });
  23  | });
  24  | 
  25  | test.describe("Screening page", () => {
  26  |   test("renders screening intro", async ({ page }) => {
  27  |     await mockSupabaseAuth(page);
  28  |     await page.goto("/screening");
  29  | 
> 30  |     await expect(page.locator(".title").first()).toBeVisible();
      |                                                  ^ Error: expect(locator).toBeVisible() failed
  31  |     await expect(page.locator(".start-btn").first()).toBeVisible();
  32  |   });
  33  | 
  34  |   test("start button navigates to questions", async ({ page }) => {
  35  |     await mockSupabaseAuth(page);
  36  |     await page.goto("/screening");
  37  | 
  38  |     await page.locator(".start-btn").first().click();
  39  |     await expect(page).toHaveURL(/\/questions/);
  40  |   });
  41  | });
  42  | 
  43  | test.describe("Questions flow", () => {
  44  |   test("renders question cards with answer buttons", async ({ page }) => {
  45  |     await mockSupabaseAuth(page);
  46  |     await page.goto("/questions");
  47  | 
  48  |     await expect(page.locator(".question-card").first()).toBeVisible();
  49  |     await expect(page.locator(".answer-btn").first()).toBeVisible();
  50  |     await expect(page.locator(".next-btn")).toBeVisible();
  51  |   });
  52  | 
  53  |   test("shows block counter and progress bar", async ({ page }) => {
  54  |     await mockSupabaseAuth(page);
  55  |     await page.goto("/questions");
  56  | 
  57  |     await expect(page.locator(".block-counter")).toBeVisible();
  58  |     await expect(page.locator(".questions-counter")).toBeVisible();
  59  |     await expect(page.locator(".q-linear-progress, [role='progressbar']").first()).toBeVisible();
  60  |   });
  61  | 
  62  |   test("answer buttons toggle active class on click", async ({ page }) => {
  63  |     await mockSupabaseAuth(page);
  64  |     await page.goto("/questions");
  65  | 
  66  |     const firstQuestion = page.locator(".question-card").first();
  67  |     const answerBtn = firstQuestion.locator(".answer-btn").first();
  68  | 
  69  |     await answerBtn.click();
  70  |     await expect(answerBtn).toHaveClass(/active/);
  71  |   });
  72  | 
  73  |   test("clicking next without answers shows validation", async ({ page }) => {
  74  |     await mockSupabaseAuth(page);
  75  |     await page.goto("/questions");
  76  | 
  77  |     await page.locator(".next-btn").click();
  78  |     // validation notification or shake animation on unanswered questions
  79  |     await expect(
  80  |       page.locator(".q-notification, .question-card.invalid").first()
  81  |     ).toBeVisible({ timeout: 3000 });
  82  |   });
  83  | 
  84  |   test("answering all questions in block 1 and clicking next advances to block 2", async ({ page }) => {
  85  |     await mockSupabaseAuth(page);
  86  |     await page.goto("/questions");
  87  | 
  88  |     // Answer all 9 questions in block 1
  89  |     const questions = page.locator(".question-card");
  90  |     const count = await questions.count();
  91  |     for (let i = 0; i < count; i++) {
  92  |       await questions.nth(i).locator(".answer-btn").nth(2).click();
  93  |     }
  94  | 
  95  |     // Click next
  96  |     await page.locator(".next-btn").click();
  97  | 
  98  |     // Should now be on block 2
  99  |     await expect(page.locator(".block-counter")).toContainText("2");
  100 |   });
  101 | 
  102 |   test("skip button on screening page goes to menu", async ({ page }) => {
  103 |     await mockSupabaseAuth(page);
  104 |     await page.goto("/screening");
  105 | 
  106 |     // Mock the screening save
  107 |     await page.route("**/*.supabase.co/rest/v1/screening_results**", (route) =>
  108 |       route.fulfill({ status: 200, json: {}, headers: { "content-type": "application/json" } }),
  109 |     );
  110 | 
  111 |     const skipBtn = page.locator(".skip-btn, button:has-text('Skip'), button:has-text('Пропустить')").first();
  112 |     if (await skipBtn.isVisible()) {
  113 |       await skipBtn.click();
  114 |       await expect(page).toHaveURL(/\/(menu|daily)/);
  115 |     }
  116 |   });
  117 | });
  118 | 
```
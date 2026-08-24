import type { Page, Route } from "@playwright/test";

const SUPABASE_URL = "**/*.supabase.co/**";

const MOCK_USER = {
  id: "test-user-id",
  email: "test@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2026-01-01T00:00:00Z",
};

const MOCK_SESSION = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_in: 3600,
  expires_at: Date.now() + 3600_000,
  token_type: "bearer",
  user: MOCK_USER,
};

export async function mockSupabaseAuth(page: Page, opts?: { user?: typeof MOCK_USER; session?: typeof MOCK_SESSION }) {
  const user = opts?.user ?? MOCK_USER;
  const session = opts?.session ?? { ...MOCK_SESSION, user };

  await page.route(SUPABASE_URL, async (route: Route, request) => {
    const url = request.url();
    const method = request.method();

    // POST /auth/v1/token (signInWithPassword, signUp)
    if (url.includes("/auth/v1/token") && method === "POST") {
      const body = request.postDataJSON();
      if (body?.grant_type === "password") {
        if (body?.email === "bad@example.com") {
          return route.fulfill({
            status: 400,
            json: { error: "invalid_grant", error_description: "Invalid login credentials" },
          });
        }
        return route.fulfill({
          status: 200,
          json: { user, session, access_token: session.access_token },
        });
      }
      // refresh token
      return route.fulfill({
        status: 200,
        json: { user, session, access_token: session.access_token },
      });
    }

    // GET /auth/v1/user (getUser)
    if (url.includes("/auth/v1/user") && method === "GET") {
      const authHeader = request.headers()["authorization"];
      if (!authHeader || authHeader === "Bearer null") {
        return route.fulfill({
          status: 200,
          json: { user: null },
        });
      }
      return route.fulfill({
        status: 200,
        json: { user },
      });
    }

    // GET /auth/v1/session (getSession)
    if (url.includes("/auth/v1/session") && method === "GET") {
      const authHeader = request.headers()["authorization"];
      if (!authHeader || authHeader === "Bearer null") {
        return route.fulfill({
          status: 200,
          json: { session: null },
        });
      }
      return route.fulfill({
        status: 200,
        json: { session },
      });
    }

    // POST /auth/v1/signup
    if (url.includes("/auth/v1/signup") && method === "POST") {
      return route.fulfill({
        status: 200,
        json: { user, session, access_token: session.access_token },
      });
    }

    // POST /auth/v1/recover (forgot password)
    if (url.includes("/auth/v1/recover") && method === "POST") {
      return route.fulfill({
        status: 200,
        json: {},
      });
    }

    // POST /auth/v1/update (updateUser password)
    if (url.includes("/auth/v1/user") && method === "PUT") {
      return route.fulfill({
        status: 200,
        json: { user },
      });
    }

    // rest/v1/screening_results — GET
    if (url.includes("/rest/v1/screening_results") && method === "GET") {
      return route.fulfill({
        status: 200,
        json: null,
        headers: { "content-type": "application/json" },
      });
    }

    // rest/v1/screening_results — POST/UPSERT
    if (url.includes("/rest/v1/screening_results") && (method === "POST" || method === "PATCH")) {
      return route.fulfill({
        status: 201,
        json: {},
      });
    }

    // rest/v1/user_progress — GET
    if (url.includes("/rest/v1/user_progress") && method === "GET") {
      return route.fulfill({
        status: 200,
        json: null,
        headers: { "content-type": "application/json" },
      });
    }

    // rest/v1/user_progress — POST/PUT
    if (url.includes("/rest/v1/user_progress") && (method === "POST" || method === "PATCH" || method === "PUT")) {
      return route.fulfill({
        status: 200,
        json: {},
      });
    }

    // rest/v1/daily_tasks
    if (url.includes("/rest/v1/daily_tasks")) {
      return route.fulfill({
        status: 200,
        json: [],
        headers: { "content-type": "application/json" },
      });
    }

    // rest/v1/daily_task_completions
    if (url.includes("/rest/v1/daily_task_completions")) {
      return route.fulfill({
        status: 200,
        json: [],
        headers: { "content-type": "application/json" },
      });
    }

    // rest/v1/weekly_tasks
    if (url.includes("/rest/v1/weekly_tasks")) {
      return route.fulfill({
        status: 200,
        json: [],
        headers: { "content-type": "application/json" },
      });
    }

    // rest/v1/weekly_task_completions
    if (url.includes("/rest/v1/weekly_task_completions")) {
      return route.fulfill({
        status: 200,
        json: [],
        headers: { "content-type": "application/json" },
      });
    }

    // rest/v1/journal_entries
    if (url.includes("/rest/v1/journal_entries")) {
      return route.fulfill({
        status: 200,
        json: [],
        headers: { "content-type": "application/json" },
      });
    }

    // fallback — pass through
    return route.fallback();
  });
}

export async function mockSupabaseNoSession(page: Page) {
  await page.route(SUPABASE_URL, async (route: Route, request) => {
    const url = request.url();

    if (url.includes("/auth/v1/user")) {
      return route.fulfill({ status: 200, json: { user: null } });
    }
    if (url.includes("/auth/v1/session")) {
      return route.fulfill({ status: 200, json: { session: null } });
    }

    return route.fallback();
  });
}

export async function mockScreeningCompleted(page: Page) {
  await page.route(SUPABASE_URL, async (route: Route, request) => {
    const url = request.url();
    const method = request.method();

    if (url.includes("/auth/v1/user") && method === "GET") {
      return route.fulfill({ status: 200, json: { user: MOCK_USER } });
    }
    if (url.includes("/auth/v1/session") && method === "GET") {
      return route.fulfill({ status: 200, json: { session: MOCK_SESSION } });
    }
    if (url.includes("/rest/v1/screening_results") && method === "GET") {
      return route.fulfill({
        status: 200,
        json: { id: "sr-1", user_id: MOCK_USER.id },
        headers: { "content-type": "application/json" },
      });
    }
    if (url.includes("/rest/v1/user_progress")) {
      return route.fulfill({
        status: 200,
        json: null,
        headers: { "content-type": "application/json" },
      });
    }
    if (url.includes("/rest/v1/daily_tasks")) {
      return route.fulfill({
        status: 200,
        json: [
          { id: "f1", day: 1, type: "food", title: "Завтрак", what_doing: "Яичница", why_doing: "Энергия", reward: null },
          { id: "m1", day: 1, type: "mental", title: "Медитация", what_doing: "10 минут", why_doing: "Фокус", reward: null },
          { id: "p1", day: 1, type: "physical", title: "Прогулка", what_doing: "30 минут", why_doing: "Здоровье", reward: null },
        ],
        headers: { "content-type": "application/json" },
      });
    }
    if (url.includes("/rest/v1/daily_task_completions")) {
      return route.fulfill({
        status: 200,
        json: [],
        headers: { "content-type": "application/json" },
      });
    }
    if (url.includes("/rest/v1/weekly_tasks")) {
      return route.fulfill({
        status: 200,
        json: [
          { id: "wk1", week: 1, title: "Дыхательная практика", what_doing: "Техника 4-7-8", why_doing: "Снижение тревожности" },
        ],
        headers: { "content-type": "application/json" },
      });
    }
    if (url.includes("/rest/v1/weekly_task_completions")) {
      return route.fulfill({
        status: 200,
        json: [],
        headers: { "content-type": "application/json" },
      });
    }
    if (url.includes("/rest/v1/journal_entries")) {
      return route.fulfill({
        status: 200,
        json: [],
        headers: { "content-type": "application/json" },
      });
    }
    if (url.includes("/auth/v1/token")) {
      return route.fulfill({ status: 200, json: { user: MOCK_USER, session: MOCK_SESSION } });
    }

    return route.fallback();
  });
}

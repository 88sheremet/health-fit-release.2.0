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
  expires_at: Date.now() + 86400_000,
  token_type: "bearer",
  user: MOCK_USER,
};

/**
 * Seed Supabase session into localStorage so the `auth` middleware
 * (which calls getSession() → reads local storage, NOT HTTP) passes.
 */
export async function seedSupabaseSession(page: Page) {
  const supabaseUrl = "https://nypmxuihlerrynxumpko.supabase.co";
  const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
  const storageKey = `sb-${projectRef}-auth-token`;

  await page.addInitScript((args) => {
    const [key, data] = args as [string, string];
    localStorage.setItem(key, data);
  }, [storageKey, JSON.stringify(MOCK_SESSION)]);
}

/**
 * Clear Supabase session from localStorage.
 */
export async function clearSupabaseSession(page: Page) {
  const supabaseUrl = "https://nypmxuihlerrynxumpko.supabase.co";
  const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
  const storageKey = `sb-${projectRef}-auth-token`;

  await page.addInitScript((key: string) => {
    localStorage.removeItem(key);
  }, storageKey);
}

function handleSupabaseRoute(
  route: Route,
  request: any,
  opts?: { user?: typeof MOCK_USER | null; session?: typeof MOCK_SESSION | null; screeningResult?: any },
) {
  const url = request.url();
  const method = request.method();
  const user = opts?.user !== undefined ? opts.user : MOCK_USER;
  const session = opts?.session !== undefined ? opts.session : MOCK_SESSION;

  // auth/v1/token (signInWithPassword, signUp, refresh)
  if (url.includes("/auth/v1/token") && method === "POST") {
    const body = request.postDataJSON();
    if (body?.grant_type === "password" && body?.email === "bad@example.com") {
      return route.fulfill({
        status: 400,
        json: { error: "invalid_grant", error_description: "Invalid login credentials" },
      });
    }
    if (!user || !session) {
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

  // auth/v1/user (GET = getUser, PUT = updateUser)
  if (url.includes("/auth/v1/user") && method === "GET") {
    if (!user) {
      return route.fulfill({ status: 200, json: { user: null } });
    }
    return route.fulfill({ status: 200, json: { user } });
  }

  if (url.includes("/auth/v1/user") && method === "PUT") {
    return route.fulfill({ status: 200, json: { user: MOCK_USER } });
  }

  // auth/v1/session (getSession)
  if (url.includes("/auth/v1/session") && method === "GET") {
    if (!session) {
      return route.fulfill({ status: 200, json: { session: null } });
    }
    return route.fulfill({ status: 200, json: { session } });
  }

  // auth/v1/signup
  if (url.includes("/auth/v1/signup") && method === "POST") {
    if (!user || !session) {
      return route.fulfill({ status: 200, json: { user: null, session: null } });
    }
    return route.fulfill({
      status: 200,
      json: { user, session, access_token: session.access_token },
    });
  }

  // auth/v1/recover
  if (url.includes("/auth/v1/recover") && method === "POST") {
    return route.fulfill({ status: 200, json: {} });
  }

  // rest/v1/screening_results
  if (url.includes("/rest/v1/screening_results") && method === "GET") {
    if (opts?.screeningResult) {
      return route.fulfill({
        status: 200,
        json: opts.screeningResult,
        headers: { "content-type": "application/json" },
      });
    }
    return route.fulfill({
      status: 200,
      json: null,
      headers: { "content-type": "application/json" },
    });
  }

  if (url.includes("/rest/v1/screening_results") && (method === "POST" || method === "PATCH")) {
    return route.fulfill({ status: 201, json: {}, headers: { "content-type": "application/json" } });
  }

  // rest/v1/user_progress
  if (url.includes("/rest/v1/user_progress") && method === "GET") {
    return route.fulfill({
      status: 200,
      json: null,
      headers: { "content-type": "application/json" },
    });
  }

  if (url.includes("/rest/v1/user_progress") && (method === "POST" || method === "PATCH" || method === "PUT")) {
    return route.fulfill({ status: 200, json: {}, headers: { "content-type": "application/json" } });
  }

  // rest/v1/daily_tasks
  if (url.includes("/rest/v1/daily_tasks") && !url.includes("completions")) {
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

  // rest/v1/daily_task_completions
  if (url.includes("/rest/v1/daily_task_completions")) {
    return route.fulfill({ status: 200, json: [], headers: { "content-type": "application/json" } });
  }

  // rest/v1/weekly_tasks
  if (url.includes("/rest/v1/weekly_tasks") && !url.includes("completions")) {
    return route.fulfill({
      status: 200,
      json: [
        { id: "wk1", week: 1, title: "Дыхательная практика", what_doing: "Техника 4-7-8", why_doing: "Снижение тревожности" },
      ],
      headers: { "content-type": "application/json" },
    });
  }

  // rest/v1/weekly_task_completions
  if (url.includes("/rest/v1/weekly_task_completions")) {
    return route.fulfill({ status: 200, json: [], headers: { "content-type": "application/json" } });
  }

  // rest/v1/journal_entries
  if (url.includes("/rest/v1/journal_entries")) {
    return route.fulfill({ status: 200, json: [], headers: { "content-type": "application/json" } });
  }

  return route.fallback();
}

/** Mock Supabase for auth pages (no session = guest) */
export async function mockSupabaseNoSession(page: Page) {
  await page.route(SUPABASE_URL, (route, request) =>
    handleSupabaseRoute(route, request, { user: null, session: null }),
  );
}

/** Mock Supabase for logged-in user (sets localStorage + route mocks) */
export async function mockSupabaseAuth(page: Page) {
  await seedSupabaseSession(page);
  await page.route(SUPABASE_URL, (route, request) =>
    handleSupabaseRoute(route, request, { user: MOCK_USER, session: MOCK_SESSION }),
  );
}

/** Mock Supabase for logged-in user with screening completed */
export async function mockScreeningCompleted(page: Page) {
  await seedSupabaseSession(page);
  await page.route(SUPABASE_URL, (route, request) =>
    handleSupabaseRoute(route, request, {
      user: MOCK_USER,
      session: MOCK_SESSION,
      screeningResult: { id: "sr-1", user_id: MOCK_USER.id },
    }),
  );
}

import { config as loadEnv } from "dotenv";
import type { Page, Route } from "@playwright/test";

loadEnv();

const SUPABASE_ROUTE = "**/*.supabase.co/**";

function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL;
  if (!url) {
    throw new Error(
      "SUPABASE_URL is not set. Add it to .env so the Supabase storage key can be derived from the project ref.",
    );
  }
  return url.replace(/\/+$/, "");
}

/**
 * The app's Supabase auth token is stored in localStorage under a key derived
 * from the project ref: `sb-<ref>-auth-token`. Deriving the ref from
 * SUPABASE_URL keeps the seeded key in sync with whatever project the app is
 * actually compiled against.
 */
function getSupabaseStorageKey(): string {
  const url = getSupabaseUrl();
  const projectRef = url.replace("https://", "").replace(/\.supabase\.co.*$/, "");
  return `sb-${projectRef}-auth-token`;
}

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
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  token_type: "bearer",
  user: MOCK_USER,
};

/**
 * Daily tasks use a multilingual schema: `daily_tasks` holds stable ids/type/day
 * while `daily_task_translations` holds the locale-specific title/what/why.
 * ids stay stable across ru/uk; only the translated columns change.
 */
const DAILY_TASKS = [
  { id: "task-1", day: 1, type: "food", reward: null },
  { id: "task-2", day: 1, type: "mental", reward: null },
  { id: "task-3", day: 1, type: "physical", reward: null },
];

type DailyTaskTranslation = {
  task_id: string;
  locale: "ru" | "uk";
  title: string;
  what_doing: string;
  why_doing: string;
};

const DAILY_TASK_TRANSLATIONS: DailyTaskTranslation[] = [
  {
    task_id: "task-1",
    locale: "ru",
    title: "Завтрак",
    what_doing: "Яичница на пару и овсянка",
    why_doing: "Дают энергию на весь день",
  },
  {
    task_id: "task-1",
    locale: "uk",
    title: "Сніданок",
    what_doing: "Яєчня на пару та вівсянка",
    why_doing: "Дають енергію на весь день",
  },
  {
    task_id: "task-2",
    locale: "ru",
    title: "Медитация",
    what_doing: "10 минут тишины и дыхания",
    why_doing: "Помогает снять стресс",
  },
  {
    task_id: "task-2",
    locale: "uk",
    title: "Медитація",
    what_doing: "10 хвилин тиші та дихання",
    why_doing: "Допомагає зняти стрес",
  },
  {
    task_id: "task-3",
    locale: "ru",
    title: "Прогулка",
    what_doing: "Прогулка 30 минут на свежем воздухе",
    why_doing: "Укрепляет здоровье",
  },
  {
    task_id: "task-3",
    locale: "uk",
    title: "Прогулянка",
    what_doing: "Прогулянка 30 хвилин на свіжому повітрі",
    why_doing: "Зміцнює здоров'я",
  },
];

/** Extract the `locale` value from a PostgREST URL (locale=eq.ru or locale=ru). */
function getRequestedLocale(url: string): string {
  const match = url.match(/locale=eq\.([a-z]{2})/) ?? url.match(/locale=([a-z]{2})/);
  return match?.[1] ?? "ru";
}

/** Extract requested task_ids from an `in.(...)` PostgREST filter. */
function getRequestedTaskIds(url: string): string[] {
  const match = url.match(/task_id=in\.\(([^)]*)\)/);
  if (!match) {
    return [];
  }
  return match[1].split(",").map((id) => id.trim());
}

/**
 * Seed Supabase session into localStorage so the `auth` middleware
 * (which calls getSession() → reads local storage, NOT HTTP) passes.
 */
export async function seedSupabaseSession(page: Page) {
  await page.addInitScript((args) => {
    const [key, data] = args as [string, string];
    localStorage.setItem(key, data);
  }, [getSupabaseStorageKey(), JSON.stringify(MOCK_SESSION)]);
}

/**
 * Clear Supabase session from localStorage.
 */
export async function clearSupabaseSession(page: Page) {
  await page.addInitScript((key: string) => {
    localStorage.removeItem(key);
  }, getSupabaseStorageKey());
}

type MockState = {
  completions: Array<Record<string, unknown>>;
};

/**
 * Build an instance of the Supabase route interceptor. Keeping `completions`
 * (and any future mutable state) inside a per-call closure means data written
 * during the page lifecycle survives `page.reload()` — the same `page.route`
 * handler stays registered across navigations.
 */
function buildRouteHandler(
  opts?: { user?: typeof MOCK_USER | null; session?: typeof MOCK_SESSION | null; screeningResult?: any; failOAuthExchange?: boolean; state?: Partial<MockState> },
) {
  const state: MockState = {
    completions: opts?.state?.completions ?? [],
  };

  return function handleSupabaseRoute(route: Route, request: any): void {
  const url = request.url();
  const method = request.method();
  const user = opts?.user !== undefined ? opts.user : MOCK_USER;
  const session = opts?.session !== undefined ? opts.session : MOCK_SESSION;

  // auth/v1/token (signInWithPassword, signUp, refresh, oauth code exchange)
  if (url.includes("/auth/v1/token") && method === "POST") {
    const body = request.postDataJSON();
    // @supabase/ssr sends `grant_type` as a URL query param for the PKCE
    // exchange (e.g. /auth/v1/token?grant_type=pkce), so read it from the URL.
    const grantType =
      body?.grant_type ??
      (url.match(/[?&]grant_type=([^&]+)/)?.[1] ?? "");

    // PKCE / authorization_code exchange (exchangeCodeForSession).
    // Google OAuth creates a brand-new session, independent of any prior one.
    // auth-js expects a FLAT token response (hasSession requires top-level
    // access_token + refresh_token + expires_in) to persist the session.
    if (
      grantType === "pkce" ||
      grantType === "authorization_code"
    ) {
      if (opts?.failOAuthExchange) {
        return route.fulfill({
          status: 400,
          json: { error: "invalid_grant", error_description: "Invalid code" },
        });
      }
      return route.fulfill({
        status: 200,
        json: {
          access_token: MOCK_SESSION.access_token,
          refresh_token: MOCK_SESSION.refresh_token,
          expires_in: MOCK_SESSION.expires_in,
          expires_at: MOCK_SESSION.expires_at,
          token_type: "bearer",
          user: MOCK_USER,
        },
      });
    }

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

  // auth/v1/authorize (signInWithOAuth) — supabase-js navigates the browser
  // directly to this URL. Redirect it straight back to the app's /auth/callback
  // with a mock code so the whole Google flow completes without a real provider.
  if (url.includes("/auth/v1/authorize")) {
    const redirectMatch = url.match(/redirect_to=([^&]*)/);
    const decoded = redirectMatch
      ? decodeURIComponent(redirectMatch[1] || "")
      : "";

    const callbackBase = decoded || "http://localhost:3100/auth/callback";

    return route.fulfill({
      status: 302,
      headers: {
        location: `${callbackBase}?code=mock-oauth-code`,
      },
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

  // rest/v1/daily_tasks (stable ids/type/day — titles come from translations)
  if (url.includes("/rest/v1/daily_tasks") && !url.includes("completions") && !url.includes("daily_task_translations")) {
    return route.fulfill({
      status: 200,
      json: DAILY_TASKS,
      headers: { "content-type": "application/json" },
    });
  }

  // rest/v1/daily_task_translations (locale-filtered)
  if (url.includes("/rest/v1/daily_task_translations")) {
    const locale = getRequestedLocale(url);
    const requestedIds = getRequestedTaskIds(url);
    let rows = DAILY_TASK_TRANSLATIONS.filter((t) => t.locale === locale);
    if (requestedIds.length > 0) {
      rows = rows.filter(
        (t) => requestedIds.includes(t.task_id),
      );
    }
    return route.fulfill({
      status: 200,
      json: rows,
      headers: { "content-type": "application/json" },
    });
  }

  // rest/v1/daily_task_completions
  if (url.includes("/rest/v1/daily_task_completions")) {
    if (method === "POST") {
      const completion = request.postDataJSON() ?? {};
      state.completions.push(completion);
      return route.fulfill({ status: 201, json: {}, headers: { "content-type": "application/json" } });
    }
    const dayMatch = url.match(/day_index=eq\.(\d+)/);
    const day = dayMatch ? Number(dayMatch[1]) : null;
    const rows = state.completions.filter(
      (c) => day === null || c.day_index === day,
    );
    return route.fulfill({ status: 200, json: rows, headers: { "content-type": "application/json" } });
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
    if (method === "POST") {
      const body = request.postDataJSON() ?? {};
      return route.fulfill({
        status: 201,
        json: {
          id: "journal-1",
          date: body.date ?? "2026-08-03",
          entry_type: body.entry_type ?? "checkin",
          mood: body.mood ?? 3,
          note: body.note ?? "",
          user_id: user.id,
          created_at: "2026-08-03T12:00:00Z",
        },
        headers: { "content-type": "application/json" },
      });
    }
    return route.fulfill({ status: 200, json: [], headers: { "content-type": "application/json" } });
  }

  return route.fallback();
  };
}

/** Mock Supabase for auth pages (no session = guest) */
export async function mockSupabaseNoSession(page: Page) {
  const handler = buildRouteHandler({ user: null, session: null });
  await page.route(SUPABASE_ROUTE, handler);
}

/** Mock Supabase for logged-in user (sets localStorage + route mocks) */
export async function mockSupabaseAuth(page: Page) {
  await seedSupabaseSession(page);
  const handler = buildRouteHandler({ user: MOCK_USER, session: MOCK_SESSION });
  await page.route(SUPABASE_ROUTE, handler);
}

/** Mock Supabase for logged-in user with screening completed */
export async function mockScreeningCompleted(page: Page) {
  await seedSupabaseSession(page);
  const handler = buildRouteHandler({
    user: MOCK_USER,
    session: MOCK_SESSION,
    screeningResult: { id: "sr-1", user_id: MOCK_USER.id },
  });
  await page.route(SUPABASE_ROUTE, handler);
}

/**
 * Mock Supabase for the Google OAuth flow. The user starts without a session
 * (so guest pages like /login render), but the OAuth code exchange produces a
 * fresh MOCK_SESSION. Pass `screeningResult` to simulate an existing user.
 */
export async function mockSupabaseOAuth(page: Page, screeningResult?: any) {
  const handler = buildRouteHandler({
    user: null,
    session: null,
    screeningResult,
  });
  await page.route(SUPABASE_ROUTE, handler);
}

/** Mock Supabase where the OAuth code exchange fails (invalid code). */
export async function mockSupabaseOAuthFailure(page: Page) {
  const handler = buildRouteHandler({
    user: null,
    session: null,
    failOAuthExchange: true,
  });
  await page.route(SUPABASE_ROUTE, handler);
}

/**
 * Freeze the page's Date to a fixed non-rest day (Monday 2026-08-03) so the
 * daily page renders its task list deterministically regardless of when the
 * tests run (rest day = Sunday returns [] from todayTasks).
 */
export async function freezeDateToMonday(page: Page) {
  await page.addInitScript(() => {
    const fixed = new Date(2026, 7, 3, 12, 0, 0).getTime();
    class FixedDate extends Date {
      constructor(...args: unknown[]) {
        if (args.length === 0) {
          super(fixed);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          super(...(args as any[]));
        }
      }
      static now() {
        return fixed;
      }
    }
    window.Date = FixedDate as unknown as DateConstructor;
  });
}

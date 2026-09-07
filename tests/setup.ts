import { vi } from "vitest";

/**
 * Nuxt auto-import globals are not defined in the Vitest node environment.
 * They are used throughout `app/` (stores, services) as bare identifiers,
 * e.g. `useSupabaseClient()`. Declare them here so any code path that really
 * calls them gets a working mock instead of a `ReferenceError`.
 *
 * Tests that exercise Supabase-IO should override the return value via
 * `vi.mocked(useSupabaseClient).mockReturnValue(...)`.
 */

type Query = Record<string, any>;

const buildQuery = (): Query => {
  const query = {} as Query;

  const chain = (target: Query) => {
    ["select", "insert", "update", "upsert", "delete", "eq", "neq", "gt", "lt", "gte", "lte", "order", "limit", "range", "contains", "ilike", "in", "or", "single", "maybeSingle"].forEach((method) => {
      target[method] = vi.fn().mockReturnValue(target);
    });
    return target;
  };

  chain(query);

  query.then = undefined;

  return query;
};

export const useSupabaseClient = vi.fn(() => {
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ data: { url: null }, error: null }),
      exchangeCodeForSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn((table: string) => buildQuery()),
  };
  return client;
}) as unknown as ReturnType<typeof vi.fn> & (() => any);

export const navigateTo = vi.fn();
export const defineNuxtRouteMiddleware = (fn: any) => fn;
export const useRuntimeConfig = vi.fn(() => ({ public: {}, supabase: {} }));
export const useRouter = vi.fn(() => ({ push: vi.fn(), replace: vi.fn() }));
export const useRoute = vi.fn(() => ({}));

if (!(globalThis as any).useSupabaseClient) (globalThis as any).useSupabaseClient = useSupabaseClient;
if (!(globalThis as any).navigateTo) (globalThis as any).navigateTo = navigateTo;
if (!(globalThis as any).defineNuxtRouteMiddleware) (globalThis as any).defineNuxtRouteMiddleware = defineNuxtRouteMiddleware;
if (!(globalThis as any).useRuntimeConfig) (globalThis as any).useRuntimeConfig = useRuntimeConfig;
if (!(globalThis as any).useRouter) (globalThis as any).useRouter = useRouter;
if (!(globalThis as any).useRoute) (globalThis as any).useRoute = useRoute;

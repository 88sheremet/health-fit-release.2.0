import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  getGoogleAuthDestination,
  signInWithGoogle,
} from "~/services/googleAuth.service";
import { routes } from "~/router/routes";
import { useSupabaseClient } from "../setup";

type OAuthSession = {
  user: { id: string; email: string };
  access_token: string;
  refresh_token: string;
};

const GOOGLE_SESSION: OAuthSession = {
  user: { id: "google-1", email: "dima@gmail.com" },
  access_token: "google-token",
  refresh_token: "google-refresh",
};

const SCREENING_PRESENT = { user_id: "google-1", id: "sr-1" };

/**
 * Integration test of the Google OAuth flow: sign in → callback →
 * code exchange → session → screening check → destination.
 */
function buildFlowMocks(opts: {
  exchangeError?: Error | null;
  session?: OAuthSession | null;
  getSessionError?: Error | null;
  screening?: unknown;
  screeningError?: Error | null;
}) {
  const chainFor = (result: unknown) => {
    const target: any = Promise.resolve(result);

    ["select", "eq", "single", "maybeSingle", "insert", "order"].forEach(
      (m) => {
        target[m] = vi.fn().mockReturnValue(target);
      },
    );

    return target;
  };

  const client = {
    auth: {
      signInWithOAuth: vi.fn().mockResolvedValue({
        data: { url: "https://accounts.google.com/o/oauth2/..." },
        error: null,
      }),
      exchangeCodeForSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: opts.exchangeError ?? null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: opts.session ?? null },
        error: opts.getSessionError ?? null,
      }),
    },
    from: vi.fn(() => chainFor({ data: opts.screening ?? null, error: opts.screeningError ?? null })),
  };

  vi.mocked(useSupabaseClient).mockReturnValue(client as any);

  return client;
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(globalThis, "window", {
    value: { location: { origin: "https://app.test" } },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("google auth integration flow", () => {
  it("existing user with screening is redirected to /daily", async () => {
    const client = buildFlowMocks({
      session: GOOGLE_SESSION,
      screening: SCREENING_PRESENT,
    });

    const destination = await getGoogleAuthDestination("oauth-code");

    expect(client.auth.exchangeCodeForSession).toHaveBeenCalledWith(
      "oauth-code",
    );
    expect(destination).toBe(routes.recovery.daily);
  });

  it("new user without screening is sent to /welcome", async () => {
    buildFlowMocks({ session: GOOGLE_SESSION, screening: null });

    const destination = await getGoogleAuthDestination("oauth-code");

    expect(destination).toBe(routes.onboarding.welcome);
  });

  it("callback without a code still resolves via the existing session", async () => {
    const client = buildFlowMocks({ session: GOOGLE_SESSION, screening: null });

    const destination = await getGoogleAuthDestination();

    expect(client.auth.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(destination).toBe(routes.onboarding.welcome);
  });

  it("failed code exchange lands on /login and does not query screening", async () => {
    const client = buildFlowMocks({
      session: null,
      exchangeError: new Error("invalid code"),
    });

    const destination = await getGoogleAuthDestination("bad-code");

    expect(destination).toBe(routes.auth.login);
    expect(client.from).not.toHaveBeenCalled();
  });

  it("missing session after callback lands on /login", async () => {
    buildFlowMocks({ session: null });

    const destination = await getGoogleAuthDestination("code");

    expect(destination).toBe(routes.auth.login);
  });

  it("screening query failure falls back to /login", async () => {
    buildFlowMocks({
      session: GOOGLE_SESSION,
      screeningError: new Error("db down"),
    });

    const destination = await getGoogleAuthDestination("code");

    expect(destination).toBe(routes.auth.login);
  });

  it("signInWithGoogle starts google oauth in the login flow", async () => {
    const client = buildFlowMocks({ session: null });

    await signInWithGoogle();

    expect(client.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "https://app.test/auth/callback",
      },
    });
  });
});
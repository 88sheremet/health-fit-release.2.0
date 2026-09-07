import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  signInWithGoogle,
  getGoogleAuthDestination,
  GOOGLE_CALLBACK_PATH,
} from "~/services/googleAuth.service";
import { routes } from "~/router/routes";
import { useSupabaseClient } from "../setup";

const MOCK_USER = {
  id: "google-user-id",
  email: "user@gmail.com",
};

type SessionResult = {
  data: { session: any };
  error: any;
};

type ScreeningResult = {
  data: any;
  error: any;
};

type ChainResult = Promise<ScreeningResult> & Record<string, any>;

function buildChain(result: ScreeningResult) {
  const target: ChainResult = Promise.resolve(result) as ChainResult;

  ["select", "eq", "single", "maybeSingle", "insert", "order"].forEach(
    (method) => {
      target[method] = vi.fn().mockReturnValue(target);
    },
  );

  return target;
}

let client: any;

function mockClient(opts?: {
  session?: any;
  sessionError?: Error | null;
  exchangeError?: Error | null;
  screeningRequests?: { data: any; error: any }[];
}) {
  const sessionData: SessionResult = {
    data: { session: opts?.session ?? null },
    error: opts?.sessionError ?? null,
  };

  const screeningRequests = opts?.screeningRequests ?? [
    { data: null, error: null },
  ];

  const screeningChain = buildChain(screeningRequests[0]);

  client = {
    auth: {
      signInWithOAuth: vi
        .fn()
        .mockResolvedValue({ data: { url: null }, error: null }),
      exchangeCodeForSession: vi.fn().mockResolvedValue({
        data: { session: opts?.session ?? null },
        error: opts?.exchangeError ?? null,
      }),
      getSession: vi.fn().mockResolvedValue(sessionData),
    },
    from: vi.fn(() => screeningChain),
    screeningChain,
  };

  vi.mocked(useSupabaseClient).mockReturnValue(client);
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("signInWithGoogle", () => {
  it("calls signInWithOAuth with the google provider and callback redirect", async () => {
    mockClient();
    // stub window for the default redirectTo
    Object.defineProperty(globalThis, "window", {
      value: { location: { origin: "https://app.example.com" } },
      writable: true,
      configurable: true,
    });

    await expect(signInWithGoogle()).resolves.toBeUndefined();

    expect(client.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "https://app.example.com" + GOOGLE_CALLBACK_PATH },
    });
  });

  it("throws when signInWithOAuth returns an error", async () => {
    mockClient();
    const supabaseError = new Error("OAuth provider unavailable");

    client.auth.signInWithOAuth.mockResolvedValue({
      data: { url: null },
      error: supabaseError,
    });

    await expect(signInWithGoogle()).rejects.toThrow("OAuth provider unavailable");
  });
});

describe("getGoogleAuthDestination", () => {
  it("exchanges the code into a session", async () => {
    mockClient({ session: { user: MOCK_USER } });

    await getGoogleAuthDestination("some-code");

    expect(client.auth.exchangeCodeForSession).toHaveBeenCalledWith(
      "some-code",
    );
  });

  it("routes to /login when no code and no session", async () => {
    mockClient({ session: null });

    const destination = await getGoogleAuthDestination();

    expect(destination).toBe(routes.auth.login);
  });

  it("routes to /login when code exchange fails", async () => {
    mockClient({
      session: null,
      exchangeError: new Error("exchange failed"),
    });

    const destination = await getGoogleAuthDestination("bad-code");

    expect(destination).toBe(routes.auth.login);
    expect(client.auth.exchangeCodeForSession).toHaveBeenCalledWith(
      "bad-code",
    );
  });

  it("routes to /login when getSession errors", async () => {
    mockClient({
      session: null,
      sessionError: new Error("session boom"),
    });

    const destination = await getGoogleAuthDestination();

    expect(destination).toBe(routes.auth.login);
  });

  it("routes to /daily when a screening result exists", async () => {
    mockClient({
      session: { user: MOCK_USER },
      screeningRequests: [{ data: { user_id: MOCK_USER.id }, error: null }],
    });

    const destination = await getGoogleAuthDestination("code");

    expect(destination).toBe(routes.recovery.daily);
  });

  it("routes to /welcome when no screening result exists", async () => {
    mockClient({ session: { user: MOCK_USER } });

    const destination = await getGoogleAuthDestination("code");

    expect(destination).toBe(routes.onboarding.welcome);
  });

  it("routes to /login when the screening query errors", async () => {
    mockClient({
      session: { user: MOCK_USER },
      screeningRequests: [{ data: null, error: new Error("screening boom") }],
    });

    const destination = await getGoogleAuthDestination("code");

    expect(destination).toBe(routes.auth.login);
  });

  it("queries screening_results by the google user id", async () => {
    mockClient({
      session: { user: MOCK_USER },
      screeningRequests: [{ data: null, error: null }],
    });

    await getGoogleAuthDestination("code");

    expect(client.from).toHaveBeenCalledWith("screening_results");
    expect(client.screeningChain.select).toHaveBeenCalled();
    expect(client.screeningChain.eq).toHaveBeenCalledWith(
      "user_id",
      MOCK_USER.id,
    );
  });
});
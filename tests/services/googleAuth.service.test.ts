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

type QueryResult = {
  data: any;
  error: any;
};

type ChainResult = Promise<QueryResult> & Record<string, any>;

function buildChain(result: QueryResult) {
  const target: ChainResult = Promise.resolve(result) as ChainResult;

  ["select", "eq", "single", "maybeSingle", "insert", "order"].forEach(
    (method) => {
      target[method] = vi.fn().mockReturnValue(target);
    }
  );

  return target;
}

let client: any;

function mockClient(opts?: {
  user?: any;
  userError?: Error | null;
  exchangeError?: Error | null;
  profile?: QueryResult;
  screening?: QueryResult;
}) {
  const profileChain = buildChain(opts?.profile ?? { data: null, error: null });
  const screeningChain = buildChain(
    opts?.screening ?? { data: null, error: null }
  );

  client = {
    auth: {
      signInWithOAuth: vi
        .fn()
        .mockResolvedValue({ data: { url: null }, error: null }),
      exchangeCodeForSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: opts?.exchangeError ?? null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: opts?.user ?? null },
        error: opts?.userError ?? null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return profileChain;
      }
      if (table === "screening_results") {
        return screeningChain;
      }
      return buildChain({ data: null, error: null });
    }),
    profileChain,
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

    await expect(signInWithGoogle()).rejects.toThrow(
      "OAuth provider unavailable"
    );
  });
});

describe("getGoogleAuthDestination", () => {
  it("exchanges the code into a session", async () => {
    mockClient({
      user: MOCK_USER,
      profile: { data: { gender: "male" }, error: null },
    });

    await getGoogleAuthDestination("some-code");

    expect(client.auth.exchangeCodeForSession).toHaveBeenCalledWith(
      "some-code"
    );
  });

  it("routes to /login when no code and no user", async () => {
    mockClient({ user: null });

    const destination = await getGoogleAuthDestination();

    expect(destination).toBe(routes.auth.login);
  });

  it("routes to /login when code exchange fails", async () => {
    mockClient({
      user: MOCK_USER,
      exchangeError: new Error("exchange failed"),
    });

    const destination = await getGoogleAuthDestination("bad-code");

    expect(destination).toBe(routes.auth.login);
    expect(client.auth.exchangeCodeForSession).toHaveBeenCalledWith("bad-code");
  });

  it("routes to /login when getUser errors", async () => {
    mockClient({
      user: null,
      userError: new Error("user boom"),
    });

    const destination = await getGoogleAuthDestination();

    expect(destination).toBe(routes.auth.login);
  });

  it("routes to /profile-setup when the profile is missing", async () => {
    mockClient({
      user: MOCK_USER,
      profile: { data: null, error: null },
    });

    const destination = await getGoogleAuthDestination("code");

    expect(destination).toBe("/profile-setup");
  });

  it("routes to /profile-setup when the gender is not set", async () => {
    mockClient({
      user: MOCK_USER,
      profile: { data: { gender: null }, error: null },
    });

    const destination = await getGoogleAuthDestination("code");

    expect(destination).toBe("/profile-setup");
  });

  it("routes to /login when the profile query errors", async () => {
    mockClient({
      user: MOCK_USER,
      profile: { data: null, error: new Error("profile boom") },
    });

    const destination = await getGoogleAuthDestination("code");

    expect(destination).toBe(routes.auth.login);
  });

  it("routes to /daily when a profile and a screening result exist", async () => {
    mockClient({
      user: MOCK_USER,
      profile: { data: { gender: "female" }, error: null },
      screening: { data: { user_id: MOCK_USER.id }, error: null },
    });

    const destination = await getGoogleAuthDestination("code");

    expect(destination).toBe(routes.recovery.daily);
  });

  it("routes to /welcome when a profile exists but no screening result", async () => {
    mockClient({
      user: MOCK_USER,
      profile: { data: { gender: "female" }, error: null },
      screening: { data: null, error: null },
    });

    const destination = await getGoogleAuthDestination("code");

    expect(destination).toBe(routes.onboarding.welcome);
  });

  it("routes to /login when the screening query errors", async () => {
    mockClient({
      user: MOCK_USER,
      profile: { data: { gender: "female" }, error: null },
      screening: { data: null, error: new Error("screening boom") },
    });

    const destination = await getGoogleAuthDestination("code");

    expect(destination).toBe(routes.auth.login);
  });

  it("queries profiles by the google user id", async () => {
    mockClient({
      user: MOCK_USER,
      profile: { data: { gender: "male" }, error: null },
    });

    await getGoogleAuthDestination("code");

    expect(client.from).toHaveBeenCalledWith("profiles");
    expect(client.profileChain.select).toHaveBeenCalled();
    expect(client.profileChain.eq).toHaveBeenCalledWith(
      "user_id",
      MOCK_USER.id
    );
  });

  it("queries screening_results by the google user id", async () => {
    mockClient({
      user: MOCK_USER,
      profile: { data: { gender: "male" }, error: null },
      screening: { data: null, error: null },
    });

    await getGoogleAuthDestination("code");

    expect(client.from).toHaveBeenCalledWith("screening_results");
    expect(client.screeningChain.select).toHaveBeenCalled();
    expect(client.screeningChain.eq).toHaveBeenCalledWith(
      "user_id",
      MOCK_USER.id
    );
  });
});

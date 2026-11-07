import { describe, it, expect, vi, beforeEach } from "vitest";

import guestMiddleware from "~/middleware/guest";
import { navigateTo, useSupabaseClient } from "../setup";

type Result = { data: any; error: any };

function buildChain(result: Result): any {
  const target: any = Promise.resolve(result);

  ["select", "eq", "maybeSingle"].forEach((method) => {
    target[method] = vi.fn().mockReturnValue(target);
  });

  return target;
}

interface GuestScenario {
  user?: { id: string } | null;
  userError?: unknown;
  profile?: { gender: string | null } | null;
  profileError?: unknown;
  screening?: { id: string } | null;
  screeningError?: unknown;
}

function mockGuest(scenario: GuestScenario) {
  const from = vi.fn((table: string) => {
    if (table === "profiles") {
      return buildChain({
        data: scenario.profile ?? null,
        error: scenario.profileError ?? null,
      });
    }

    return buildChain({
      data: scenario.screening ?? null,
      error: scenario.screeningError ?? null,
    });
  });

  vi.mocked(useSupabaseClient).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: scenario.user ?? null },
        error: scenario.userError ?? null,
      }),
    },
    from,
  } as any);

  return from;
}

async function runMiddleware() {
  return (guestMiddleware as any)({} as any, {} as any, () => {});
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("guest middleware", () => {
  it("allows guests through when there is no user", async () => {
    const from = mockGuest({ user: null });

    await runMiddleware();

    expect(navigateTo).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it("allows the page when the user request fails", async () => {
    mockGuest({ user: null, userError: new Error("auth boom") });

    await runMiddleware();

    expect(navigateTo).not.toHaveBeenCalled();
  });

  it("does nothing when the profile query fails", async () => {
    mockGuest({
      user: { id: "u1" },
      profileError: new Error("profile boom"),
    });

    await runMiddleware();

    expect(navigateTo).not.toHaveBeenCalled();
  });

  it("redirects to profile setup when gender is missing", async () => {
    mockGuest({ user: { id: "u1" }, profile: { gender: null } });

    await runMiddleware();

    expect(navigateTo).toHaveBeenCalledWith("/profile-setup");
  });

  it("redirects to /daily when screening is already completed", async () => {
    mockGuest({
      user: { id: "u1" },
      profile: { gender: "female" },
      screening: { id: "s1" },
    });

    await runMiddleware();

    expect(navigateTo).toHaveBeenCalledWith("/daily");
  });

  it("redirects to /welcome when screening is missing", async () => {
    mockGuest({
      user: { id: "u1" },
      profile: { gender: "male" },
      screening: null,
    });

    await runMiddleware();

    expect(navigateTo).toHaveBeenCalledWith("/welcome");
  });

  it("does nothing when the screening query fails", async () => {
    mockGuest({
      user: { id: "u1" },
      profile: { gender: "male" },
      screeningError: new Error("screening boom"),
    });

    await runMiddleware();

    expect(navigateTo).not.toHaveBeenCalled();
  });
});

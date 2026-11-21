import { describe, it, expect, vi, beforeEach } from "vitest";

import authMiddleware from "~/middleware/auth";
import { navigateTo, useSupabaseClient } from "../setup";

function mockSession(session: unknown, error: unknown = null) {
  vi.mocked(useSupabaseClient).mockReturnValue({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session }, error }),
    },
  } as any);
}

async function runMiddleware() {
  return (authMiddleware as any)({} as any, {} as any, () => {});
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("auth middleware", () => {
  it("allows navigation when a session exists", async () => {
    mockSession({ access_token: "token" });

    await runMiddleware();

    expect(navigateTo).not.toHaveBeenCalled();
  });

  it("redirects to login when there is no session", async () => {
    mockSession(null);

    await runMiddleware();

    expect(navigateTo).toHaveBeenCalledWith("/login");
  });

  it("redirects to login when the session request fails", async () => {
    mockSession(null, new Error("session boom"));

    await runMiddleware();

    expect(navigateTo).toHaveBeenCalledWith("/login");
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  MORNING_ROUTINE_WEEK,
  MORNING_ROUTINE_DAY_COUNT,
  getMorningRoutineCompletions,
  completeMorningRoutineDay,
} from "~/services/morningRoutine.service";
import { useSupabaseClient } from "../setup";

const MORNING_ROUTINE_TASK_ID = "81658713-0b40-463c-914f-899952d824b0";

type Result = { data: any; error: any };

function buildChain(result: Result) {
  const target: any = Promise.resolve(result);

  ["select", "insert", "eq", "order"].forEach((method) => {
    target[method] = vi.fn().mockReturnValue(target);
  });

  return target;
}

let mockFrom: ReturnType<typeof vi.fn>;
let chains: Record<string, any>;

function mockClient(result: Result, user: { id: string } | null = { id: "u1" }) {
  chains = {};
  const chain = buildChain(result);
  chains["weekly_task_daily_completions"] = chain;

  mockFrom = vi.fn(() => chain);

  vi.mocked(useSupabaseClient).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: mockFrom,
  } as any);

  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getMorningRoutineCompletions", () => {
  it("throws when the user is not authenticated", async () => {
    const chain = mockClient({ data: [], error: null }, null);

    await expect(getMorningRoutineCompletions()).rejects.toThrow(
      "Пользователь не авторизован"
    );
    expect(mockFrom).not.toHaveBeenCalled();
    expect(chain.select).not.toHaveBeenCalled();
  });

  it("rethrows an auth error", async () => {
    vi.mocked(useSupabaseClient).mockReturnValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: null }, error: new Error("auth") }),
      },
      from: vi.fn(),
    } as any);

    await expect(getMorningRoutineCompletions()).rejects.toThrow("auth");
  });

  it("filters by user, challenge task id and week, then sorts days", async () => {
    const chain = mockClient({
      data: [{ day_number: 5 }, { day_number: 1 }, { day_number: 3 }],
      error: null,
    });

    const result = await getMorningRoutineCompletions();

    expect(mockFrom).toHaveBeenCalledWith("weekly_task_daily_completions");
    expect(chain.select).toHaveBeenCalledWith("day_number");
    expect(chain.eq).toHaveBeenCalledWith("user_id", "u1");
    expect(chain.eq).toHaveBeenCalledWith(
      "weekly_task_id",
      MORNING_ROUTINE_TASK_ID
    );
    expect(chain.eq).toHaveBeenCalledWith("week", MORNING_ROUTINE_WEEK);
    expect(chain.order).toHaveBeenCalledWith("day_number", {
      ascending: true,
    });
    expect(result).toEqual([5, 1, 3]);
  });

  it("returns an empty array when there are no completions", async () => {
    mockClient({ data: null, error: null });

    await expect(getMorningRoutineCompletions()).resolves.toEqual([]);
  });

  it("rethrows a query error", async () => {
    mockClient({ data: null, error: new Error("load boom") });

    await expect(getMorningRoutineCompletions()).rejects.toThrow("load boom");
  });
});

describe("completeMorningRoutineDay", () => {
  it.each([0, -1, 8, 1.5, NaN])(
    "rejects invalid day %s before touching Supabase",
    async (day) => {
      const chain = mockClient({ data: null, error: null });

      await expect(completeMorningRoutineDay(day)).rejects.toThrow(
        "Некорректный номер дня челленджа"
      );
      expect(mockFrom).not.toHaveBeenCalled();
      expect(chain.insert).not.toHaveBeenCalled();
    }
  );

  it("rejects a non-numeric day", async () => {
    mockClient({ data: null, error: null });

    await expect(
      completeMorningRoutineDay("2" as unknown as number)
    ).rejects.toThrow("Некорректный номер дня челленджа");
  });

  it("accepts the first and last challenge days", async () => {
    const chain = mockClient({ data: null, error: null });

    await expect(completeMorningRoutineDay(1)).resolves.toBe(true);
    await expect(
      completeMorningRoutineDay(MORNING_ROUTINE_DAY_COUNT)
    ).resolves.toBe(true);
    expect(chain.insert).toHaveBeenCalledTimes(2);
  });

  it("throws when the user is not authenticated", async () => {
    const chain = mockClient({ data: null, error: null }, null);

    await expect(completeMorningRoutineDay(1)).rejects.toThrow(
      "Пользователь не авторизован"
    );
    expect(chain.insert).not.toHaveBeenCalled();
  });

  it("rethrows an auth error", async () => {
    vi.mocked(useSupabaseClient).mockReturnValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: null }, error: new Error("auth") }),
      },
      from: vi.fn(),
    } as any);

    await expect(completeMorningRoutineDay(1)).rejects.toThrow("auth");
  });

  it("inserts a completion for the challenge task and week", async () => {
    const chain = mockClient({ data: null, error: null });

    const result = await completeMorningRoutineDay(3);

    expect(mockFrom).toHaveBeenCalledWith("weekly_task_daily_completions");
    expect(chain.insert).toHaveBeenCalledWith({
      user_id: "u1",
      weekly_task_id: MORNING_ROUTINE_TASK_ID,
      week: MORNING_ROUTINE_WEEK,
      day_number: 3,
    });
    expect(result).toBe(true);
  });

  it("returns false when the day is already completed (23505)", async () => {
    mockClient({ data: null, error: { code: "23505", message: "duplicate" } });

    await expect(completeMorningRoutineDay(2)).resolves.toBe(false);
  });

  it("rethrows other insert errors", async () => {
    mockClient({ data: null, error: { code: "42501", message: "denied" } });

    await expect(completeMorningRoutineDay(2)).rejects.toMatchObject({
      code: "42501",
    });
  });
});

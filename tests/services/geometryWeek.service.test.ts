import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  getGeometryWeekProgress,
  completeGeometryWeekDay,
} from "~/services/geometryWeek.service";
import { useSupabaseClient } from "../setup";

type Result = { data: any; error: any };

interface TableCall {
  table: string;
  chain: any;
}

function buildChain(result: Result): any {
  const target: any = Promise.resolve(result);

  [
    "select",
    "insert",
    "update",
    "upsert",
    "delete",
    "eq",
    "order",
    "single",
    "maybeSingle",
  ].forEach((method) => {
    target[method] = vi.fn().mockReturnValue(target);
  });

  return target;
}

let calls: TableCall[];

function mockClient(
  results: Record<string, Result> = {},
  user: { id: string } | null = { id: "u1" },
  userError: Error | null = null
) {
  calls = [];

  const from = vi.fn((table: string) => {
    const chain = buildChain(
      results[table] ?? { data: null, error: null }
    );
    calls.push({ table, chain });
    return chain;
  });

  vi.mocked(useSupabaseClient).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: userError,
      }),
    },
    from,
  } as any);
}

function chainFor(table: string) {
  return calls.find((call) => call.table === table)?.chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getGeometryWeekProgress", () => {
  it("returns the completed days ordered by day", async () => {
    mockClient({
      weekly_task_day_completions: {
        data: [{ day: 1 }, { day: 3 }, { day: 5 }],
        error: null,
      },
    });

    await expect(getGeometryWeekProgress("t1", 2)).resolves.toEqual([1, 3, 5]);

    const chain = chainFor("weekly_task_day_completions");
    expect(chain.select).toHaveBeenCalledWith("day");
    expect(chain.eq).toHaveBeenCalledWith("weekly_task_id", "t1");
    expect(chain.eq).toHaveBeenCalledWith("week", 2);
    expect(chain.order).toHaveBeenCalledWith("day", { ascending: true });
  });

  it("returns an empty list when there is no data", async () => {
    mockClient({ weekly_task_day_completions: { data: null, error: null } });

    await expect(getGeometryWeekProgress("t1", 1)).resolves.toEqual([]);
  });

  it("rethrows the read error", async () => {
    mockClient({
      weekly_task_day_completions: {
        data: null,
        error: new Error("load boom"),
      },
    });

    await expect(getGeometryWeekProgress("t1", 1)).rejects.toThrow(
      "load boom"
    );
  });
});

describe("completeGeometryWeekDay validation", () => {
  it.each<[string, number, number, string]>([
    ["", 1, 1, "Не указан ID недельного задания."],
    ["t1", 0, 1, "Некорректный номер недели."],
    ["t1", 1.5, 1, "Некорректный номер недели."],
    ["t1", 1, 0, "Некорректный номер этапа."],
    ["t1", 1, 8, "Некорректный номер этапа."],
    ["t1", 1, 2.5, "Некорректный номер этапа."],
  ])(
    "rejects taskId=%j week=%j day=%j",
    async (taskId, week, day, message) => {
      mockClient();

      await expect(
        completeGeometryWeekDay(taskId, week, day)
      ).rejects.toThrow(message);
      expect(calls).toHaveLength(0);
    }
  );
});

describe("completeGeometryWeekDay", () => {
  it("throws when the user cannot be resolved", async () => {
    mockClient({}, null);

    await expect(completeGeometryWeekDay("t1", 1, 1)).rejects.toThrow(
      "Не удалось определить пользователя."
    );
  });

  it("throws when auth returns an error", async () => {
    mockClient({}, null, new Error("auth boom"));

    await expect(completeGeometryWeekDay("t1", 1, 1)).rejects.toThrow(
      "Не удалось определить пользователя."
    );
  });

  it("inserts the completion with the current user", async () => {
    mockClient({
      weekly_task_day_completions: { data: null, error: null },
    });

    await expect(
      completeGeometryWeekDay("t1", 2, 4)
    ).resolves.toBeUndefined();

    const chain = chainFor("weekly_task_day_completions");
    expect(chain.insert).toHaveBeenCalledWith({
      user_id: "u1",
      weekly_task_id: "t1",
      week: 2,
      day: 4,
    });
  });

  it("maps a duplicate key error to a friendly message", async () => {
    mockClient({
      weekly_task_day_completions: {
        data: null,
        error: { code: "23505", message: "duplicate" },
      },
    });

    await expect(completeGeometryWeekDay("t1", 1, 1)).rejects.toThrow(
      "Этот этап уже был выполнен."
    );
  });

  it("rethrows other insert errors", async () => {
    mockClient({
      weekly_task_day_completions: {
        data: null,
        error: new Error("insert boom"),
      },
    });

    await expect(completeGeometryWeekDay("t1", 1, 1)).rejects.toThrow(
      "insert boom"
    );
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  getWeeklyTasks,
  getWeeklyCompletions,
  completeWeeklyTask,
} from "~/services/weeklyTask.service";
import { useSupabaseClient } from "../setup";

const baseTask = {
  id: "wk1",
  week: 1,
  title: "Original title",
  what_doing: "Original instructions",
  why_doing: "Original reason",
};

const ruTranslation = {
  id: "translation-ru-1",
  weekly_task_id: "wk1",
  locale: "ru",
  title: "Дыхательная практика",
  what_doing: "Техника 4-7-8",
  why_doing: "Снижение тревожности",
};

const ukTranslation = {
  id: "translation-uk-1",
  weekly_task_id: "wk1",
  locale: "uk",
  title: "Дихальна практика",
  what_doing: "Техніка 4-7-8",
  why_doing: "Зниження тривожності",
};

type Result = { data: any; error: any };

function buildChain(result: Result) {
  const target: any = Promise.resolve(result);

  [
    "select",
    "insert",
    "update",
    "upsert",
    "delete",
    "eq",
    "order",
    "in",
    "single",
    "maybeSingle",
  ].forEach((method) => {
    target[method] = vi.fn().mockReturnValue(target);
  });

  return target;
}

let mockFrom: ReturnType<typeof vi.fn>;
let chainByTable: Record<string, any>;

function mockTables(tables: Record<string, Result>) {
  chainByTable = {};

  mockFrom = vi.fn((table: string) => {
    const chain = buildChain(tables[table] ?? { data: [], error: null });
    chainByTable[table] = chain;
    return chain;
  });

  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    from: mockFrom,
  };

  vi.mocked(useSupabaseClient).mockReturnValue(client as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getWeeklyTasks", () => {
  it("loads ru tasks with ru translations (stable weekly task id)", async () => {
    mockTables({
      weekly_tasks: { data: [baseTask], error: null },
      weekly_task_translations: { data: [ruTranslation], error: null },
    });

    const result = await getWeeklyTasks("ru");

    expect(mockFrom).toHaveBeenCalledWith("weekly_tasks");
    expect(mockFrom).toHaveBeenCalledWith("weekly_task_translations");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("wk1");
    expect(result[0].title).toBe("Дыхательная практика");
    expect(result[0].what_doing).toBe("Техника 4-7-8");
    expect(result[0].why_doing).toBe("Снижение тревожности");
  });

  it("loads uk tasks with uk translations", async () => {
    mockTables({
      weekly_tasks: { data: [baseTask], error: null },
      weekly_task_translations: { data: [ukTranslation], error: null },
    });

    const result = await getWeeklyTasks("uk");

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Дихальна практика");
    expect(result[0].what_doing).toBe("Техніка 4-7-8");
    expect(result[0].why_doing).toBe("Зниження тривожності");
  });

  it("keeps weekly_tasks id and never uses translation row id", async () => {
    mockTables({
      weekly_tasks: { data: [baseTask], error: null },
      weekly_task_translations: { data: [ukTranslation], error: null },
    });

    const result = await getWeeklyTasks("uk");

    expect(result[0].id).toBe("wk1");
    expect(result[0].id).not.toBe("translation-uk-1");
  });

  it("queries translations with .eq('locale', locale)", async () => {
    mockTables({
      weekly_tasks: { data: [baseTask], error: null },
      weekly_task_translations: { data: [ukTranslation], error: null },
    });

    await getWeeklyTasks("uk");

    expect(chainByTable["weekly_task_translations"].eq).toHaveBeenCalledWith(
      "locale",
      "uk",
    );
  });

  it("queries translations with .in('weekly_task_id', taskIds)", async () => {
    mockTables({
      weekly_tasks: { data: [baseTask], error: null },
      weekly_task_translations: { data: [ukTranslation], error: null },
    });

    await getWeeklyTasks("uk");

    expect(chainByTable["weekly_task_translations"].in).toHaveBeenCalledWith(
      "weekly_task_id",
      ["wk1"],
    );
  });

  it("selects only the relevant columns on translations", async () => {
    mockTables({
      weekly_tasks: { data: [baseTask], error: null },
      weekly_task_translations: { data: [ukTranslation], error: null },
    });

    await getWeeklyTasks("uk");

    const selectCall = chainByTable["weekly_task_translations"].select.mock.calls[0][0];
    expect(selectCall).toContain("weekly_task_id");
    expect(selectCall).toContain("locale");
    expect(selectCall).toContain("title");
  });

  it("falls back to the original task when no translation exists", async () => {
    mockTables({
      weekly_tasks: { data: [baseTask], error: null },
      weekly_task_translations: { data: [], error: null },
    });

    const result = await getWeeklyTasks("uk");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("wk1");
    expect(result[0].title).toBe("Original title");
    expect(result[0].what_doing).toBe("Original instructions");
    expect(result[0].why_doing).toBe("Original reason");
  });

  it("throws when loading weekly_tasks errors", async () => {
    mockTables({
      weekly_tasks: { data: null, error: new Error("boom") },
    });

    await expect(getWeeklyTasks("ru")).rejects.toThrow("boom");
  });

  it("throws when loading translations errors", async () => {
    mockTables({
      weekly_tasks: { data: [baseTask], error: null },
      weekly_task_translations: { data: null, error: new Error("trans boom") },
    });

    await expect(getWeeklyTasks("ru")).rejects.toThrow("trans boom");
  });

  it("returns [] when weekly_tasks is empty", async () => {
    mockTables({
      weekly_tasks: { data: [], error: null },
    });

    const result = await getWeeklyTasks("ru");

    expect(result).toEqual([]);
    expect(mockFrom).toHaveBeenCalledWith("weekly_tasks");
    expect(mockFrom).not.toHaveBeenCalledWith("weekly_task_translations");
  });

  it("does not translate a task with a translation for a different task id", async () => {
    const otherTranslation = { ...ukTranslation, weekly_task_id: "wk-999" };

    mockTables({
      weekly_tasks: { data: [baseTask], error: null },
      weekly_task_translations: { data: [otherTranslation], error: null },
    });

    const result = await getWeeklyTasks("uk");

    expect(result[0].id).toBe("wk1");
    expect(result[0].title).toBe("Original title");
  });
});

describe("getWeeklyCompletions", () => {
  it("clears user and returns [] when no user", async () => {
    mockTables({});

    vi.mocked(useSupabaseClient).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      from: mockFrom,
    } as any);

    const result = await getWeeklyCompletions();

    expect(result).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalledWith("weekly_task_completions");
  });

  it("returns week numbers from completions for the current user", async () => {
    mockTables({
      weekly_task_completions: {
        data: [{ week: 1 }, { week: 2 }, { week: 1 }],
        error: null,
      },
    });

    const result = await getWeeklyCompletions();

    expect(mockFrom).toHaveBeenCalledWith("weekly_task_completions");
    expect(chainByTable["weekly_task_completions"].eq).toHaveBeenCalledWith(
      "user_id",
      "u1",
    );
    expect(result).toEqual([1, 2, 1]);
  });

  it("throws on completion query error", async () => {
    mockTables({
      weekly_task_completions: { data: null, error: new Error("completions boom") },
    });

    await expect(getWeeklyCompletions()).rejects.toThrow("completions boom");
  });
});

describe("completeWeeklyTask", () => {
  it("throws when no user", async () => {
    mockTables({});

    vi.mocked(useSupabaseClient).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      from: mockFrom,
    } as any);

    await expect(completeWeeklyTask("wk1", 1)).rejects.toThrow(
      "Пользователь не авторизован",
    );
  });

  it("inserts a completion row with user/week/task ids", async () => {
    mockTables({
      weekly_task_completions: {
        data: { id: "c1", user_id: "u1", weekly_task_id: "wk1", week: 1 },
        error: null,
      },
    });

    const result = await completeWeeklyTask("wk1", 1);

    const insertChain = chainByTable["weekly_task_completions"];
    expect(insertChain.insert).toHaveBeenCalledWith({
      user_id: "u1",
      weekly_task_id: "wk1",
      week: 1,
    });
    expect(insertChain.single).toHaveBeenCalledOnce();
    expect(result?.id).toBe("c1");
  });

  it("throws on insert error", async () => {
    mockTables({
      weekly_task_completions: { data: null, error: new Error("insert boom") },
    });

    await expect(completeWeeklyTask("wk1", 1)).rejects.toThrow("insert boom");
  });
});
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { getDailyTasks } from "~/services/dailyTask.service";
import { useSupabaseClient } from "../setup";

const baseTask = {
  id: "task-1",
  day: 1,
  type: "physical",
  title: "Original title",
  what_doing: "Original instructions",
  why_doing: "Original reason",
  reward: 15,
};

const ruTranslation = {
  id: "translation-ru-1",
  task_id: "task-1",
  locale: "ru",
  title: "Русская задача",
  what_doing: "Русское описание",
  why_doing: "Русская причина",
};

const ukTranslation = {
  id: "translation-uk-1",
  task_id: "task-1",
  locale: "uk",
  title: "Українське завдання",
  what_doing: "Український опис",
  why_doing: "Українська причина",
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

describe("getDailyTasks", () => {
  it("loads ru tasks with ru translations (stable task id)", async () => {
    mockTables({
      daily_tasks: { data: [baseTask], error: null },
      daily_task_translations: { data: [ruTranslation], error: null },
    });

    const result = await getDailyTasks("ru");

    expect(mockFrom).toHaveBeenCalledWith("daily_tasks");
    expect(mockFrom).toHaveBeenCalledWith("daily_task_translations");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("task-1");
    expect(result[0].title).toBe("Русская задача");
    expect(result[0].what_doing).toBe("Русское описание");
    expect(result[0].why_doing).toBe("Русская причина");
  });

  it("loads uk tasks with uk translations", async () => {
    mockTables({
      daily_tasks: { data: [baseTask], error: null },
      daily_task_translations: { data: [ukTranslation], error: null },
    });

    const result = await getDailyTasks("uk");

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Українське завдання");
    expect(result[0].what_doing).toBe("Український опис");
    expect(result[0].why_doing).toBe("Українська причина");
  });

  it("keeps daily_tasks id and never uses translation row id", async () => {
    mockTables({
      daily_tasks: { data: [baseTask], error: null },
      daily_task_translations: { data: [ukTranslation], error: null },
    });

    const result = await getDailyTasks("uk");

    expect(result[0].id).toBe("task-1");
    expect(result[0].id).not.toBe("translation-uk-1");
  });

  it("queries translations with .eq('locale', locale)", async () => {
    mockTables({
      daily_tasks: { data: [baseTask], error: null },
      daily_task_translations: { data: [ukTranslation], error: null },
    });

    await getDailyTasks("uk");

    expect(chainByTable["daily_task_translations"].eq).toHaveBeenCalledWith(
      "locale",
      "uk",
    );
  });

  it("queries translations with .in('task_id', taskIds)", async () => {
    mockTables({
      daily_tasks: { data: [baseTask], error: null },
      daily_task_translations: { data: [ukTranslation], error: null },
    });

    await getDailyTasks("uk");

    expect(chainByTable["daily_task_translations"].in).toHaveBeenCalledWith(
      "task_id",
      ["task-1"],
    );
  });

  it("selects only the relevant columns on translations", async () => {
    mockTables({
      daily_tasks: { data: [baseTask], error: null },
      daily_task_translations: { data: [ukTranslation], error: null },
    });

    await getDailyTasks("uk");

    const selectCall = chainByTable["daily_task_translations"].select.mock.calls[0][0];
    expect(selectCall).toContain("task_id");
    expect(selectCall).toContain("locale");
    expect(selectCall).toContain("title");
  });

  it("falls back to the original task when no translation exists", async () => {
    mockTables({
      daily_tasks: { data: [baseTask], error: null },
      daily_task_translations: { data: [], error: null },
    });

    const result = await getDailyTasks("uk");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("task-1");
    expect(result[0].title).toBe("Original title");
    expect(result[0].what_doing).toBe("Original instructions");
    expect(result[0].why_doing).toBe("Original reason");
  });

  it("throws when loading daily_tasks errors", async () => {
    mockTables({
      daily_tasks: { data: null, error: new Error("boom") },
    });

    await expect(getDailyTasks("ru")).rejects.toThrow("boom");
  });

  it("throws when loading translations errors", async () => {
    mockTables({
      daily_tasks: { data: [baseTask], error: null },
      daily_task_translations: { data: null, error: new Error("trans boom") },
    });

    await expect(getDailyTasks("ru")).rejects.toThrow("trans boom");
  });

  it("returns [] when daily_tasks is empty", async () => {
    mockTables({
      daily_tasks: { data: [], error: null },
    });

    const result = await getDailyTasks("ru");

    expect(result).toEqual([]);
    expect(mockFrom).toHaveBeenCalledWith("daily_tasks");
    expect(mockFrom).not.toHaveBeenCalledWith("daily_task_translations");
  });

  it("does not translate a task with a translation for a different task id", async () => {
    const otherTranslation = { ...ukTranslation, task_id: "task-999" };

    mockTables({
      daily_tasks: { data: [baseTask], error: null },
      daily_task_translations: { data: [otherTranslation], error: null },
    });

    const result = await getDailyTasks("uk");

    expect(result[0].id).toBe("task-1");
    expect(result[0].title).toBe("Original title");
  });
});

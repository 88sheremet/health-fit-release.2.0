import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  FoodDiaryError,
  deleteFoodDiaryEntry,
  loadFoodDiary,
  saveFoodDiaryDates,
  saveFoodDiaryEntry,
  setFoodDiaryStage,
} from "~/services/weeklyFoodDiary.service";
import { useSupabaseClient } from "../setup";

const FOOD_DIARY_TASK_ID = "5382c1d1-f307-4076-a7e7-97e1c03fc5a7";
const OTHER_TASK_ID = "not-a-food-diary-task";

type Result = { data: any; error: any };

interface TableCall {
  table: string;
  chain: any;
}

// Возвращает цепочку запроса, которая одновременно является thenable,
// поэтому подходит и для `.single()`, и для прямого `await`.
function buildChain(result: Result): any {
  const target: any = Promise.resolve(result);

  [
    "select",
    "insert",
    "update",
    "upsert",
    "delete",
    "eq",
    "neq",
    "order",
    "in",
    "single",
    "maybeSingle",
  ].forEach((method) => {
    target[method] = vi.fn().mockReturnValue(target);
  });

  return target;
}

let calls: TableCall[];
let queues: Record<string, Result[]>;

// Каждый вызов from(table) забирает следующий результат из очереди таблицы.
function mockClient(
  tables: Record<string, Result[]>,
  user: { id: string } | null = { id: "u1" }
) {
  calls = [];
  queues = {};

  const defaults: Record<string, Result> = {
    weekly_food_diary_sessions: { data: null, error: null },
    weekly_food_diary_entries: { data: [], error: null },
  };

  const from = vi.fn((table: string) => {
    queues[table] = queues[table] ?? [...(tables[table] ?? [])];
    const next = queues[table].shift() ?? defaults[table] ?? { data: null, error: null };
    const chain = buildChain(next);
    calls.push({ table, chain });
    return chain;
  });

  vi.mocked(useSupabaseClient).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from,
  } as any);
}

function chainsFor(table: string) {
  return calls.filter((call) => call.table === table).map((call) => call.chain);
}

async function expectCode(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toBeInstanceOf(FoodDiaryError);
  await expect(promise).rejects.toMatchObject({ code });
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FoodDiaryError", () => {
  it("keeps the machine-readable code next to the message", () => {
    const error = new FoodDiaryError("unauthorized", "no user");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("FoodDiaryError");
    expect(error.code).toBe("unauthorized");
    expect(error.message).toBe("no user");
  });
});

describe("validateTaskId", () => {
  it("rejects a foreign task id when loading", async () => {
    mockClient({});

    await expectCode(loadFoodDiary(OTHER_TASK_ID, 1), "invalidTask");
  });

  it("rejects a foreign task id before saving an entry", async () => {
    mockClient({});

    await expectCode(
      saveFoodDiaryEntry(OTHER_TASK_ID, 1, {
        entry_date: "2026-06-01",
        meal_type: "breakfast",
        meal_time: "08:00",
        description: "Овсянка",
        feeling: "",
      }),
      "invalidTask"
    );
  });

  it("rejects a foreign task id before deleting an entry", async () => {
    mockClient({});

    await expectCode(
      deleteFoodDiaryEntry(OTHER_TASK_ID, 1, "e1"),
      "invalidTask"
    );
  });

  it("rejects a foreign task id before saving dates", async () => {
    mockClient({});

    await expectCode(
      saveFoodDiaryDates(OTHER_TASK_ID, 1, "2026-06-01", "2026-06-02"),
      "invalidTask"
    );
  });
});

describe("authorization", () => {
  it("rejects with the unauthorized code when there is no user", async () => {
    mockClient({}, null);

    await expectCode(
      loadFoodDiary(FOOD_DIARY_TASK_ID, 1),
      "unauthorized"
    );
  });

  it("rethrows the auth error", async () => {
    vi.mocked(useSupabaseClient).mockReturnValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: null }, error: new Error("auth boom") }),
      },
      from: vi.fn(),
    } as any);

    await expect(loadFoodDiary(FOOD_DIARY_TASK_ID, 1)).rejects.toThrow(
      "auth boom"
    );
  });
});

describe("loadFoodDiary", () => {
  it("returns an empty diary when there is no session yet", async () => {
    mockClient({
      weekly_food_diary_sessions: [{ data: null, error: null }],
    });

    await expect(loadFoodDiary(FOOD_DIARY_TASK_ID, 2)).resolves.toEqual({
      session: null,
      entries: [],
    });
    expect(chainsFor("weekly_food_diary_entries")).toHaveLength(0);
  });

  it("returns the session and its entries ordered by date and time", async () => {
    const session = {
      id: "s1",
      first_date: "2026-06-01",
      second_date: "2026-06-02",
      stage: "collecting",
      analysis: null,
    };
    const entries = [
      { id: "e1", entry_date: "2026-06-01", meal_type: "breakfast" },
    ];
    mockClient({
      weekly_food_diary_sessions: [{ data: session, error: null }],
      weekly_food_diary_entries: [{ data: entries, error: null }],
    });

    const result = await loadFoodDiary(FOOD_DIARY_TASK_ID, 2);

    expect(result).toEqual({ session, entries });
    const entriesChain = chainsFor("weekly_food_diary_entries")[0];
    expect(entriesChain.order).toHaveBeenCalledWith("entry_date", {
      ascending: true,
    });
    expect(entriesChain.order).toHaveBeenCalledWith("meal_time", {
      ascending: true,
    });
  });

  it("rethrows the session read error", async () => {
    mockClient({
      weekly_food_diary_sessions: [
        { data: null, error: new Error("session boom") },
      ],
    });

    await expect(loadFoodDiary(FOOD_DIARY_TASK_ID, 1)).rejects.toThrow(
      "session boom"
    );
  });
});

describe("saveFoodDiaryDates", () => {
  it.each([
    ["", "2026-06-02"],
    ["2026-06-01", ""],
    ["2026-06-01", "2026-06-01"],
  ])("rejects (%j, %j) as invalidDates", async (first, second) => {
    mockClient({});

    await expectCode(
      saveFoodDiaryDates(FOOD_DIARY_TASK_ID, 1, first, second),
      "invalidDates"
    );
  });

  it("rejects dates that would orphan existing entries", async () => {
    mockClient({
      weekly_food_diary_sessions: [
        { data: { first_date: "2026-06-01", second_date: "2026-06-02" }, error: null },
      ],
      weekly_food_diary_entries: [
        { data: [{ id: "e1", entry_date: "2026-06-01" }], error: null },
      ],
    });

    await expectCode(
      saveFoodDiaryDates(FOOD_DIARY_TASK_ID, 1, "2026-06-03", "2026-06-04"),
      "orphanedDates"
    );
  });

  it("upserts the session and resets analysis", async () => {
    const session = {
      id: "s1",
      first_date: "2026-06-01",
      second_date: "2026-06-02",
      stage: "collecting",
      analysis: null,
    };
    mockClient({
      weekly_food_diary_sessions: [
        { data: null, error: null },
        { data: session, error: null },
      ],
    });

    const result = await saveFoodDiaryDates(
      FOOD_DIARY_TASK_ID,
      2,
      "2026-06-01",
      "2026-06-02"
    );

    expect(result).toEqual(session);
    const upsertChain = chainsFor("weekly_food_diary_sessions")[1];
    expect(upsertChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "u1",
        weekly_task_id: FOOD_DIARY_TASK_ID,
        program_week: 2,
        first_date: "2026-06-01",
        second_date: "2026-06-02",
        stage: "collecting",
        analysis: null,
      }),
      { onConflict: "user_id,weekly_task_id,program_week" }
    );
  });
});

describe("saveFoodDiaryEntry", () => {
  it("rejects when the dates are not chosen yet", async () => {
    mockClient({
      weekly_food_diary_sessions: [{ data: null, error: null }],
    });

    await expectCode(
      saveFoodDiaryEntry(FOOD_DIARY_TASK_ID, 1, {
        entry_date: "2026-06-01",
        meal_type: "breakfast",
        meal_time: "08:00",
        description: "Овсянка",
        feeling: "",
      }),
      "datesNotChosen"
    );
  });

  it("rejects an entry date that is not one of the chosen dates", async () => {
    mockClient({
      weekly_food_diary_sessions: [
        {
          data: { first_date: "2026-06-01", second_date: "2026-06-02" },
          error: null,
        },
      ],
    });

    await expectCode(
      saveFoodDiaryEntry(FOOD_DIARY_TASK_ID, 1, {
        entry_date: "2026-06-03",
        meal_type: "breakfast",
        meal_time: "08:00",
        description: "Овсянка",
        feeling: "",
      }),
      "dateMismatch"
    );
  });

  it("rejects an empty description", async () => {
    mockClient({
      weekly_food_diary_sessions: [
        {
          data: { first_date: "2026-06-01", second_date: "2026-06-02" },
          error: null,
        },
      ],
    });

    await expectCode(
      saveFoodDiaryEntry(FOOD_DIARY_TASK_ID, 1, {
        entry_date: "2026-06-01",
        meal_type: "breakfast",
        meal_time: "08:00",
        description: "   ",
        feeling: "",
      }),
      "descriptionRequired"
    );
  });

  it("inserts a normalized entry and invalidates the analysis", async () => {
    const entry = {
      id: "e1",
      entry_date: "2026-06-01",
      meal_type: "breakfast",
      meal_time: "08:00",
      description: "Овсянка",
      feeling: null,
    };
    mockClient({
      weekly_food_diary_sessions: [
        {
          data: { first_date: "2026-06-01", second_date: "2026-06-02" },
          error: null,
        },
        { data: null, error: null },
      ],
      weekly_food_diary_entries: [{ data: entry, error: null }],
    });

    const result = await saveFoodDiaryEntry(FOOD_DIARY_TASK_ID, 1, {
      entry_date: "2026-06-01",
      meal_type: "breakfast",
      meal_time: "08:00",
      description: "  Овсянка  ",
      feeling: "   ",
    });

    expect(result).toEqual(entry);
    const insertChain = chainsFor("weekly_food_diary_entries")[0];
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "u1",
        entry_date: "2026-06-01",
        description: "Овсянка",
        feeling: null,
      })
    );
    const invalidateChain = chainsFor("weekly_food_diary_sessions")[1];
    expect(invalidateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "collecting", analysis: null })
    );
  });
});

describe("deleteFoodDiaryEntry", () => {
  it("deletes the entry scoped to the user and resets the analysis", async () => {
    mockClient({
      weekly_food_diary_entries: [{ data: null, error: null }],
      weekly_food_diary_sessions: [{ data: null, error: null }],
    });

    await deleteFoodDiaryEntry(FOOD_DIARY_TASK_ID, 1, "e1");

    const deleteChain = chainsFor("weekly_food_diary_entries")[0];
    expect(deleteChain.delete).toHaveBeenCalledOnce();
    expect(deleteChain.eq).toHaveBeenCalledWith("id", "e1");
    expect(deleteChain.eq).toHaveBeenCalledWith("user_id", "u1");
    expect(chainsFor("weekly_food_diary_sessions")[0].update).toHaveBeenCalled();
  });
});

describe("setFoodDiaryStage", () => {
  it("rejects review when a chosen day has no entries", async () => {
    mockClient({
      weekly_food_diary_sessions: [
        {
          data: { first_date: "2026-06-01", second_date: "2026-06-02" },
          error: null,
        },
      ],
      weekly_food_diary_entries: [
        { data: [{ entry_date: "2026-06-01" }], error: null },
      ],
    });

    await expectCode(
      setFoodDiaryStage(FOOD_DIARY_TASK_ID, 1, "review"),
      "missingEntryBothDays"
    );
  });

  it("allows review when both chosen days have entries", async () => {
    mockClient({
      weekly_food_diary_sessions: [
        {
          data: { first_date: "2026-06-01", second_date: "2026-06-02" },
          error: null,
        },
        { data: null, error: null },
      ],
      weekly_food_diary_entries: [
        {
          data: [{ entry_date: "2026-06-01" }, { entry_date: "2026-06-02" }],
          error: null,
        },
      ],
    });

    await expect(
      setFoodDiaryStage(FOOD_DIARY_TASK_ID, 1, "review")
    ).resolves.toBeUndefined();

    const updateChain = chainsFor("weekly_food_diary_sessions")[1];
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "review" })
    );
  });

  it("does not require entries when returning to collecting", async () => {
    mockClient({
      weekly_food_diary_sessions: [
        {
          data: { first_date: "2026-06-01", second_date: "2026-06-02" },
          error: null,
        },
        { data: null, error: null },
      ],
    });

    await setFoodDiaryStage(FOOD_DIARY_TASK_ID, 1, "collecting");

    expect(chainsFor("weekly_food_diary_entries")).toHaveLength(0);
    const updateChain = chainsFor("weekly_food_diary_sessions")[1];
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "collecting", analysis: null })
    );
  });
});

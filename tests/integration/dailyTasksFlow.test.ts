import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useTaskStore } from "~/stores/dailyTasks";

const { mockDailyTasks, getDailyTasks } = vi.hoisted(() => {
  const baseByDay = [
    { id: "task-1", day: 1, type: "food" as const },
    { id: "task-2", day: 1, type: "mental" as const },
    { id: "task-3", day: 1, type: "physical" as const },
  ];

  const ruTasks = baseByDay.map((t) => ({
    id: t.id,
    day: t.day,
    type: t.type,
    title: `Русская ${t.type}`,
    what_doing: `опис ${t.type}`,
    why_doing: `причина ${t.type}`,
    reward: t.type === "physical" ? 15 : 10,
  }));

  const ukTasks = baseByDay.map((t) => ({
    id: t.id,
    day: t.day,
    type: t.type,
    title: `Українське ${t.type}`,
    what_doing: `опис ${t.type}`,
    why_doing: `причина ${t.type}`,
    reward: t.type === "physical" ? 15 : 10,
  }));

  return {
    mockDailyTasks: { ru: ruTasks, uk: ukTasks },
    getDailyTasks: vi.fn((locale: string) =>
      Promise.resolve(mockDailyTasks[locale] ?? mockDailyTasks.ru),
    ),
  };
});

vi.mock("~/services/dailyTask.service", () => ({
  getDailyTasks,
}));

let mockCompleteInsert: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();

  mockCompleteInsert = vi.fn().mockResolvedValue({ data: null, error: null });

  vi.stubGlobal(
    "useSupabaseClient",
    vi.fn(() => ({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "test-user" } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "daily_task_completions") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            insert: mockCompleteInsert,
          };
        }

        if (table === "user_progress") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
            insert: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: "p1",
                user_id: "test-user",
                start_date: "2026-06-15",
                energy: 40,
                streak: 1,
                last_visit_date: "2026-06-15",
              },
              error: null,
            }),
            update: vi.fn().mockReturnThis(),
          };
        }

        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          single: vi.fn().mockResolvedValue({ data: {}, error: null }),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
        };
      }),
    })),
  );

  setActivePinia(createPinia());
});

afterEach(() => {
  vi.useRealTimers();
});

describe("daily tasks flow integration", () => {
  it("loads tasks and returns all rows", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));

    const store = useTaskStore();
    store.startDate = "2026-06-15";
    await store.loadTasks();

    expect(store.tasksLoaded).toBe(true);
    expect(store.tasks).toHaveLength(3);
    expect(getDailyTasks).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it("loads ru translated tasks and keeps daily_tasks id", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));

    const store = useTaskStore();
    store.startDate = "2026-06-15";
    await store.loadTasks("ru");

    expect(getDailyTasks).toHaveBeenCalledWith("ru");
    expect(store.tasks[0].id).toBe("task-1");
    expect(store.tasks[0].title).toBe("Русская food");

    vi.useRealTimers();
  });

  it("loads uk translated tasks and keeps daily_tasks id", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));

    const store = useTaskStore();
    store.startDate = "2026-06-15";
    await store.loadTasks("uk");

    expect(getDailyTasks).toHaveBeenCalledWith("uk");
    expect(store.tasks[0].id).toBe("task-1");
    expect(store.tasks[0].title).toBe("Українське food");

    vi.useRealTimers();
  });

  it("todayTasks exposes translated tasks via the store", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));

    const store = useTaskStore();
    store.startDate = "2026-06-15";
    await store.loadTasks("uk");

    const todayTasks = store.todayTasks;
    expect(todayTasks).toHaveLength(3);
    expect(todayTasks.every((t) => /Українське/.test(t.title))).toBe(true);
    todayTasks.forEach((t) => expect([t.id]).toContain(t.id));

    vi.useRealTimers();
  });

  it("rest day returns empty todayTasks", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-14T12:00:00"));

    const store = useTaskStore();
    store.startDate = "2026-06-14";
    await store.loadTasks("ru");

    expect(store.isRestDay).toBe(true);
    expect(store.todayTasks).toEqual([]);

    vi.useRealTimers();
  });

  it("completeTask writes daily_tasks id to daily_task_completions", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));

    const store = useTaskStore();
    store.startDate = "2026-06-15";
    await store.loadTasks("uk");

    const task = store.todayTasks.find((t) => t.type === "physical")!;
    expect(task.id).toBe("task-3");

    await store.completeTask(task);

    expect(mockCompleteInsert).toHaveBeenCalledWith(
      expect.objectContaining({ task_id: "task-3" }),
    );
    expect(store.isDone("task-3")).toBe(true);

    vi.useRealTimers();
  });
});

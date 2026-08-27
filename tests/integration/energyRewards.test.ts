import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useTaskStore } from "~/stores/dailyTasks";
import { useWeeklyTaskStore } from "~/stores/weeklyTasks";

const { mockDailyTasks, mockWeeklyTasks, getDailyTasks, getWeeklyTasks, getWeeklyCompletions, completeWeeklyTask } = vi.hoisted(() => ({
  mockDailyTasks: [
    { id: "f1", day: 1, type: "food" as const, title: "Breakfast", what_doing: "Cook", why_doing: "Health", reward: null },
    { id: "m1", day: 1, type: "mental" as const, title: "Meditate", what_doing: "10 min", why_doing: "Focus", reward: null },
    { id: "p1", day: 1, type: "physical" as const, title: "Walk", what_doing: "30 min", why_doing: "Fitness", reward: null },
  ],
  mockWeeklyTasks: [
    { id: "wk1", week: 1, title: "Breathing", what_doing: "4-7-8", why_doing: "Calm" },
  ],
  getDailyTasks: vi.fn(),
  getWeeklyTasks: vi.fn(),
  getWeeklyCompletions: vi.fn(),
  completeWeeklyTask: vi.fn(),
}));

vi.mock("~/services/dailyTask.service", () => ({
  getDailyTasks,
}));

vi.mock("~/services/weeklyTask.service", () => ({
  getWeeklyTasks,
  getWeeklyCompletions,
  completeWeeklyTask,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("useSupabaseClient", vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user" } }, error: null }) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    }),
  })));
  setActivePinia(createPinia());
  getDailyTasks.mockResolvedValue(mockDailyTasks);
  getWeeklyTasks.mockResolvedValue(mockWeeklyTasks);
  getWeeklyCompletions.mockResolvedValue([]);
  completeWeeklyTask.mockResolvedValue({});
});

afterEach(() => {
  vi.useRealTimers();
});

describe("energy rewards cross-store integration", () => {
  it("daily task reward: physical gives 15, food/mental give 10", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));

    const store = useTaskStore();
    store.startDate = "2026-06-15";
    store.energy = 0;
    await store.loadTasks();

    const tasks = store.todayTasks;
    expect(tasks.find((t) => t.type === "food")!.reward).toBe(10);
    expect(tasks.find((t) => t.type === "mental")!.reward).toBe(10);
    expect(tasks.find((t) => t.type === "physical")!.reward).toBe(15);

    vi.useRealTimers();
  });

  it("weekly task completion rewards 100 energy to daily store", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));

    const daily = useTaskStore();
    daily.startDate = "2026-06-15";
    daily.energy = 0;

    const weekly = useWeeklyTaskStore();
    await weekly.loadTasks();

    expect(daily.energy).toBe(0);
    await weekly.completeCurrentTask();
    expect(daily.energy).toBe(100);

    vi.useRealTimers();
  });

  it("daily tasks are empty on rest day (Sunday)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-14T12:00:00"));

    const store = useTaskStore();
    store.startDate = "2026-06-14";
    await store.loadTasks();

    expect(store.isRestDay).toBe(true);
    expect(store.todayTasks).toEqual([]);

    vi.useRealTimers();
  });

  it("completedCount reflects multiple completions across stores", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));

    const daily = useTaskStore();
    daily.startDate = "2026-06-15";
    daily.completed = { "task-a": true, "task-b": true };
    expect(daily.completedCount).toBe(2);

    const weekly = useWeeklyTaskStore();
    weekly.completed = { 1: true, 2: true };
    expect(Object.values(weekly.completed).filter(Boolean).length).toBe(2);

    vi.useRealTimers();
  });

  it("weekly init loads tasks and completions together", async () => {
    getWeeklyCompletions.mockResolvedValue([1, 2]);

    const daily = useTaskStore();
    daily.startDate = "";

    const weekly = useWeeklyTaskStore();
    await weekly.init();

    expect(getWeeklyTasks).toHaveBeenCalledOnce();
    expect(getWeeklyCompletions).toHaveBeenCalledOnce();
    expect(weekly.completed[1]).toBe(true);
    expect(weekly.completed[2]).toBe(true);
    expect(weekly.completed[3]).toBeUndefined();

    vi.useRealTimers();
  });
});

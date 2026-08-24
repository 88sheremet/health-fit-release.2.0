import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useTaskStore } from "~/stores/dailyTasks";

vi.mock("#imports", () => ({
  useSupabaseClient: vi.fn(),
}));

const { mockTasks, getDailyTasks } = vi.hoisted(() => ({
  mockTasks: [
    { id: "f1", day: 1, type: "food" as const, title: "Eat breakfast", what_doing: "Cook eggs", why_doing: "Health", reward: null },
    { id: "f2", day: 2, type: "food" as const, title: "Eat lunch", what_doing: "Cook salad", why_doing: "Health", reward: null },
    { id: "m1", day: 1, type: "mental" as const, title: "Meditate", what_doing: "10 min", why_doing: "Focus", reward: null },
    { id: "m2", day: 2, type: "mental" as const, title: "Journal", what_doing: "Write", why_doing: "Reflection", reward: null },
    { id: "p1", day: 1, type: "physical" as const, title: "Walk", what_doing: "30 min", why_doing: "Fitness", reward: null },
    { id: "p2", day: 2, type: "physical" as const, title: "Stretch", what_doing: "15 min", why_doing: "Flexibility", reward: null },
  ],
  getDailyTasks: vi.fn(),
}));

vi.mock("~/services/dailyTask.service", () => ({
  getDailyTasks,
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
  getDailyTasks.mockResolvedValue(mockTasks);
});

describe("daily tasks flow integration", () => {
  it("loads tasks and returns all rows", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));

    const store = useTaskStore();
    store.startDate = "2026-06-15";
    await store.loadTasks();

    expect(store.tasksLoaded).toBe(true);
    expect(store.tasks).toHaveLength(6);
    expect(getDailyTasks).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it("todayTasks picks one task per type for day 1", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));

    const store = useTaskStore();
    store.startDate = "2026-06-15";
    await store.loadTasks();

    const todayTasks = store.todayTasks;
    expect(todayTasks).toHaveLength(3);
    const types = todayTasks.map((t) => t.type).sort();
    expect(types).toEqual(["food", "mental", "physical"]);
    todayTasks.forEach((t) => expect(t.id).toBeTruthy());

    vi.useRealTimers();
  });

  it("todayTasks picks day-2 tasks when dayIndex=2", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-16T12:00:00"));

    const store = useTaskStore();
    store.startDate = "2026-06-15";
    await store.loadTasks();

    const todayTasks = store.todayTasks;
    expect(todayTasks).toHaveLength(3);
    todayTasks.forEach((t) => {
      expect(t.id).toBeTruthy();
      expect(["food", "mental", "physical"]).toContain(t.type);
    });

    vi.useRealTimers();
  });

  it("task rewards: 10 for food/mental, 15 for physical", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));

    const store = useTaskStore();
    store.startDate = "2026-06-15";
    await store.loadTasks();

    const tasks = store.todayTasks;
    expect(tasks.find((t) => t.type === "food")!.reward).toBe(10);
    expect(tasks.find((t) => t.type === "mental")!.reward).toBe(10);
    expect(tasks.find((t) => t.type === "physical")!.reward).toBe(15);

    vi.useRealTimers();
  });

  it("isDone tracks completion state through todayTasks", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));

    const store = useTaskStore();
    store.startDate = "2026-06-15";
    await store.loadTasks();

    const tasks = store.todayTasks;
    expect(store.isDone(tasks[0].id)).toBe(false);

    store.completed[tasks[0].id] = true;
    expect(store.isDone(tasks[0].id)).toBe(true);
    expect(store.completedCount).toBe(1);

    vi.useRealTimers();
  });

  it("rest day returns empty todayTasks", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-14T12:00:00"));

    const store = useTaskStore();
    store.startDate = "2026-06-14";
    await store.loadTasks();

    expect(store.isRestDay).toBe(true);
    expect(store.todayTasks).toEqual([]);

    vi.useRealTimers();
  });
});

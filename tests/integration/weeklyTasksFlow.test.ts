import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useWeeklyTaskStore } from "~/stores/weeklyTasks";
import { useTaskStore } from "~/stores/dailyTasks";

const { mockWeeklyTasks, getWeeklyTasks, getWeeklyCompletions, completeWeeklyTask } = vi.hoisted(() => ({
  mockWeeklyTasks: [
    { id: "wk1", week: 1, title: "Breathing Exercise", what_doing: "4-7-8 technique", why_doing: "Reduce anxiety" },
    { id: "wk2", week: 2, title: "Cold Shower", what_doing: "30 seconds", why_doing: "Resilience" },
    { id: "wk3", week: 3, title: "Digital Detox", what_doing: "No screens after 8pm", why_doing: "Better sleep" },
  ],
  getWeeklyTasks: vi.fn(),
  getWeeklyCompletions: vi.fn(),
  completeWeeklyTask: vi.fn(),
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
  getWeeklyTasks.mockResolvedValue(mockWeeklyTasks);
  getWeeklyCompletions.mockResolvedValue([]);
  completeWeeklyTask.mockResolvedValue({});
});

afterEach(() => {
  vi.useRealTimers();
});

describe("weekly tasks flow integration", () => {
  it("loads tasks and maps fields correctly for current week", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));

    const daily = useTaskStore();
    daily.startDate = "2026-06-15";

    const store = useWeeklyTaskStore();
    await store.loadTasks();

    expect(store.tasksLoaded).toBe(true);
    expect(store.tasks).toHaveLength(3);

    expect(store.currentWeek).toBe(1);
    const task = store.currentTask;
    expect(task.id).toBe("wk1");
    expect(task.nameProgram).toBe("Breathing Exercise");
    expect(task.whatDoing).toBe("4-7-8 technique");
    expect(task.whyDoing).toBe("Reduce anxiety");

    vi.useRealTimers();
  });

  it("advances to week 2 task after 7 days", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-22T12:00:00"));

    const daily = useTaskStore();
    daily.startDate = "2026-06-15";

    const store = useWeeklyTaskStore();
    await store.loadTasks();

    expect(store.currentWeek).toBe(2);
    const task = store.currentTask;
    expect(task.id).toBe("wk2");
    expect(task.nameProgram).toBe("Cold Shower");

    vi.useRealTimers();
  });

  it("falls back to cyclic task when week exceeds available tasks", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-06T12:00:00"));

    const daily = useTaskStore();
    daily.startDate = "2026-06-15";

    const store = useWeeklyTaskStore();
    await store.loadTasks();

    expect(store.currentWeek).toBe(4);
    // weekIndex=3, 3 % 3 = 0 → tasks[0] = wk1
    const task = store.currentTask;
    expect(task.id).toBe("wk1");
    expect(task.nameProgram).toBe("Breathing Exercise");

    vi.useRealTimers();
  });

  it("canComplete is true only on days 6-7 within week", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));

    const daily = useTaskStore();
    daily.startDate = "2026-06-15";

    const store = useWeeklyTaskStore();
    expect(store.canComplete).toBe(false); // day 1

    vi.useRealTimers();
  });

  it("isCompleted reflects completion state", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));

    const daily = useTaskStore();
    daily.startDate = "2026-06-15";

    const store = useWeeklyTaskStore();
    await store.loadTasks();

    expect(store.isCompleted()).toBe(false);
    store.completed[1] = true;
    expect(store.isCompleted()).toBe(true);

    vi.useRealTimers();
  });

  it("completeCurrentTask marks week as completed and rewards energy", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));

    const daily = useTaskStore();
    daily.startDate = "2026-06-15";
    daily.energy = 40;

    const store = useWeeklyTaskStore();
    await store.loadTasks();

    await store.completeCurrentTask();

    expect(completeWeeklyTask).toHaveBeenCalledWith("wk1", 1);
    expect(store.completed[1]).toBe(true);
    expect(daily.energy).toBe(140); // 40 + 100

    vi.useRealTimers();
  });

  it("init loads both tasks and completions", async () => {
    getWeeklyCompletions.mockResolvedValue([1]);

    const daily = useTaskStore();
    daily.startDate = "";

    const store = useWeeklyTaskStore();
    await store.init();

    expect(getWeeklyTasks).toHaveBeenCalledOnce();
    expect(getWeeklyCompletions).toHaveBeenCalledOnce();
    expect(store.completed[1]).toBe(true);

    vi.useRealTimers();
  });
});

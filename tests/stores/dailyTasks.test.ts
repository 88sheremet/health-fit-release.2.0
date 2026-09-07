import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useTaskStore } from "~/stores/dailyTasks";
import { useSupabaseClient } from "../setup";

vi.mock("~/services/dailyTask.service", () => ({
  getDailyTasks: vi.fn(),
}));

import { getDailyTasks } from "~/services/dailyTask.service";

const mockedGetDailyTasks = vi.mocked(getDailyTasks);

let mockGetUser: ReturnType<typeof vi.fn>;
let mockCompleteInsert: ReturnType<typeof vi.fn>;
let progressRow: any;

function setupSupabaseClient(user: any) {
  mockGetUser = vi.fn().mockResolvedValue({
    data: { user },
    error: null,
  });

  const buildCompletionsRead = () =>
    vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      })),
    }));

  mockCompleteInsert = vi.fn().mockResolvedValue({ data: null, error: null });

  const client = {
    auth: {
      getUser: mockGetUser,
    },

    from: vi.fn((table: string) => {
      if (table === "user_progress") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: progressRow,
            error: null,
          }),
          insert: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: "p1",
              user_id: user?.id ?? "",
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

      if (table === "daily_task_completions") {
        return {
          select: buildCompletionsRead(),
          eq: vi.fn().mockReturnThis(),
          insert: mockCompleteInsert,
        };
      }

      return {};
    }),
  };

  vi.mocked(useSupabaseClient).mockReturnValue(client as any);
}

beforeEach(() => {
  setActivePinia(createPinia());
  progressRow = null;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("dailyTasks store", () => {
  describe("dayIndex", () => {
    it("returns 1 when no startDate", () => {
      const store = useTaskStore();
      store.startDate = "";
      expect(store.dayIndex).toBe(1);
    });

    it("returns computed day index from startDate", () => {
      const store = useTaskStore();
      store.startDate = "2026-06-15";
      // dayIndex depends on current date via getDayIndex
      expect(store.dayIndex).toBeGreaterThanOrEqual(1);
    });
  });

  describe("completedCount", () => {
    it("returns 0 when no tasks completed", () => {
      const store = useTaskStore();
      store.completed = {};
      expect(store.completedCount).toBe(0);
    });

    it("counts true values only", () => {
      const store = useTaskStore();
      store.completed = { a: true, b: false, c: true };
      expect(store.completedCount).toBe(2);
    });

    it("counts all completed", () => {
      const store = useTaskStore();
      store.completed = { a: true, b: true, c: true };
      expect(store.completedCount).toBe(3);
    });
  });

  describe("isDone", () => {
    it("returns false for unknown id", () => {
      const store = useTaskStore();
      expect(store.isDone("task-1")).toBe(false);
    });

    it("returns true for completed id", () => {
      const store = useTaskStore();
      store.completed = { "task-1": true };
      expect(store.isDone("task-1")).toBe(true);
    });

    it("returns false for false value", () => {
      const store = useTaskStore();
      store.completed = { "task-1": false };
      expect(store.isDone("task-1")).toBe(false);
    });
  });

  describe("todayTasks", () => {
    it("returns empty array on a Sunday rest day even with tasks", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-14T12:00:00")); // Sunday

      const store = useTaskStore();
      store.startDate = "2026-06-14";
      store.tasks = [
        { id: "f1", day: 1, type: "food", title: "Завтрак", reward: 10, whatDoing: "Яичница", whyDoing: "Энергия" },
        { id: "m1", day: 1, type: "mental", title: "Медитация", reward: 10, whatDoing: "10 минут", whyDoing: "Фокус" },
      ];
      expect(store.isRestDay).toBe(true);
      expect(store.todayTasks).toEqual([]);
    });

    it("returns tasks on a non-rest day", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00")); // Monday

      const store = useTaskStore();
      store.startDate = "2026-06-15";
      store.tasks = [
        { id: "f1", day: 1, type: "food", title: "Завтрак", reward: 10, whatDoing: "Яичница", whyDoing: "Энергия" },
        { id: "m1", day: 1, type: "mental", title: "Медитация", reward: 10, whatDoing: "10 минут", whyDoing: "Фокус" },
      ];
      expect(store.isRestDay).toBe(false);
      expect(store.todayTasks.map((t) => t.id)).toEqual(["f1", "m1"]);
    });
  });

  describe("state defaults", () => {
    it("starts with energy 40", () => {
      const store = useTaskStore();
      expect(store.energy).toBe(40);
    });

    it("starts with streak 1", () => {
      const store = useTaskStore();
      expect(store.streak).toBe(1);
    });

    it("starts with empty completed", () => {
      const store = useTaskStore();
      expect(store.completed).toEqual({});
    });

    it("starts with empty tasks", () => {
      const store = useTaskStore();
      expect(store.tasks).toEqual([]);
    });

    it("starts with tasksLoaded false", () => {
      const store = useTaskStore();
      expect(store.tasksLoaded).toBe(false);
    });
  });

  describe("loadTasks", () => {
    it('loadTasks("ru") calls getDailyTasks("ru") and sets tasks', async () => {
      mockedGetDailyTasks.mockResolvedValue([
        { id: "task-1", day: 1, type: "physical", title: "Русская задача", what_doing: "опис", why_doing: "причина", reward: 15 },
      ] as any);

      const store = useTaskStore();
      await store.loadTasks("ru");

      expect(mockedGetDailyTasks).toHaveBeenCalledWith("ru");
      expect(store.tasks).toHaveLength(1);
      expect(store.tasks[0].id).toBe("task-1");
      expect(store.tasksLoaded).toBe(true);
    });

    it('loadTasks("uk") calls getDailyTasks("uk")', async () => {
      mockedGetDailyTasks.mockResolvedValue([
        { id: "task-1", day: 1, type: "physical", title: "Українське завдання", what_doing: "опис", why_doing: "причина", reward: 15 },
      ] as any);

      const store = useTaskStore();
      await store.loadTasks("uk");

      expect(mockedGetDailyTasks).toHaveBeenCalledWith("uk");
      expect(store.tasks[0].title).toBe("Українське завдання");
    });

    it("uses ru by default when no locale passed", async () => {
      mockedGetDailyTasks.mockResolvedValue([]);

      const store = useTaskStore();
      await store.loadTasks();

      expect(mockedGetDailyTasks).toHaveBeenCalledWith("ru");
    });

    it("rethrows loadTasks error and still sets tasksLoaded=true", async () => {
      mockedGetDailyTasks.mockRejectedValue(new Error("load failed"));

      const store = useTaskStore();
      await expect(store.loadTasks("ru")).rejects.toThrow("load failed");

      expect(store.tasksLoaded).toBe(true);
    });
  });

  describe("init", () => {
    it('init("ru") passes "ru" to loadTasks', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00"));
      setupSupabaseClient({ id: "u1" });
      mockedGetDailyTasks.mockResolvedValue([]);

      const store = useTaskStore();
      await store.init("ru");

      expect(mockedGetDailyTasks).toHaveBeenCalledWith("ru");
      vi.useRealTimers();
    });

    it('init("uk") passes "uk" to loadTasks', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00"));
      setupSupabaseClient({ id: "u1" });
      mockedGetDailyTasks.mockResolvedValue([]);

      const store = useTaskStore();
      await store.init("uk");

      expect(mockedGetDailyTasks).toHaveBeenCalledWith("uk");
      vi.useRealTimers();
    });
  });

  describe("locale switch preserves progress", () => {
    it("loadTasks('uk') replaces tasks but keeps completed/startDate/energy/streak", async () => {
      mockedGetDailyTasks.mockResolvedValueOnce([
        { id: "task-1", day: 1, type: "physical", title: "Русская задача", what_doing: "опис", why_doing: "причина", reward: 15 },
      ] as any);

      const store = useTaskStore();
      await store.loadTasks("ru");

      mockedGetDailyTasks.mockResolvedValueOnce([
        { id: "task-1", day: 1, type: "physical", title: "Українське завдання", what_doing: "український опис", why_doing: "причина", reward: 15 },
      ] as any);

      store.completed = { "task-1": true };
      store.startDate = "2026-06-15T12:00:00.000Z";
      store.energy = 100;
      store.streak = 5;

      await store.loadTasks("uk");

      expect(store.tasks[0].title).toBe("Українське завдання");
      expect(store.completed).toEqual({ "task-1": true });
      expect(store.startDate).toBe("2026-06-15T12:00:00.000Z");
      expect(store.energy).toBe(100);
      expect(store.streak).toBe(5);
    });
  });

  describe("completeTask", () => {
    it("uses task.id (from daily_tasks) in the completion insert", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00"));
      setupSupabaseClient({ id: "u1" });
      progressRow = { id: "p1", user_id: "u1", start_date: "2026-06-15", energy: 40, streak: 1, last_visit_date: "2026-06-15" };

      const store = useTaskStore();
      store.energy = 40;

      const task = {
        id: "task-1",
        type: "physical" as const,
        title: "Українське завдання",
        reward: 15,
        whatDoing: "опис",
        whyDoing: "причина",
      };

      await store.completeTask(task);

      expect(mockCompleteInsert).toHaveBeenCalledWith(
        expect.objectContaining({ task_id: "task-1" }),
      );
      expect(store.completed["task-1"]).toBe(true);
      expect(store.energy).toBe(55);
      vi.useRealTimers();
    });

    it("does not duplicate completion when task already completed", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00"));
      setupSupabaseClient({ id: "u1" });

      const store = useTaskStore();
      store.energy = 40;
      store.completed = { "task-1": true };

      const task = {
        id: "task-1",
        type: "physical" as const,
        title: "Задача",
        reward: 15,
        whatDoing: "опис",
        whyDoing: "причина",
      };

      await store.completeTask(task);

      expect(mockCompleteInsert).not.toHaveBeenCalled();
      expect(store.completedCount).toBe(1);
      vi.useRealTimers();
    });
  });

  describe("addEnergy", () => {
    it("increments energy in state", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00"));
      setupSupabaseClient({ id: "u1" });

      const store = useTaskStore();
      store.energy = 40;

      await store.addEnergy(100);

      expect(store.energy).toBe(140);
      vi.useRealTimers();
    });
  });
});

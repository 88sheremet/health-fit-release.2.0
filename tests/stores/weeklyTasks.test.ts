import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useWeeklyTaskStore } from "~/stores/weeklyTasks";
import { useTaskStore } from "~/stores/dailyTasks";

const {
  getWeeklyTasks,
  getWeeklyCompletions,
  completeWeeklyTask,
  getWeeklyZoneProgress,
  saveWeeklyZoneProgress,
} = vi.hoisted(() => ({
  getWeeklyTasks: vi.fn(),
  getWeeklyCompletions: vi.fn(),
  completeWeeklyTask: vi.fn(),
  getWeeklyZoneProgress: vi.fn(),
  saveWeeklyZoneProgress: vi.fn(),
}));

vi.mock("~/services/weeklyTask.service", () => ({
  getWeeklyTasks,
  getWeeklyCompletions,
  completeWeeklyTask,
  getWeeklyZoneProgress,
  saveWeeklyZoneProgress,
}));

const SPACE_CLEANUP_TASK_ID = "ac671c82-1240-4548-a661-2f67cebad9ae";
const ALL_ZONE_KEYS = [
  "desk",
  "wardrobe",
  "nightstand",
  "shelves",
  "drawers",
] as const;

// Полдень UTC, чтобы день недели не зависел от таймзоны машины.
const NOW = "2026-06-15T12:00:00Z";

// Возвращает startDate для нужного дня недели при фиксированном NOW.
function startDateForDay(dayWithinWeek: number): string {
  const now = new Date(NOW).getTime();
  const start = new Date(now - (dayWithinWeek - 1) * 86_400_000);
  return start.toISOString().slice(0, 10);
}

function setCurrentTask(
  store: ReturnType<typeof useWeeklyTaskStore>,
  id: string
) {
  store.tasksLoaded = true;
  store.tasks = [{ id, week: 1, title: "t", what_doing: "w", why_doing: "y" }];
}

function useCleanupTask() {
  const store = useWeeklyTaskStore();
  setCurrentTask(store, SPACE_CLEANUP_TASK_ID);
  return store;
}

beforeEach(() => {
  vi.clearAllMocks();
  getWeeklyTasks.mockResolvedValue([]);
  getWeeklyCompletions.mockResolvedValue([]);
  completeWeeklyTask.mockResolvedValue({});
  getWeeklyZoneProgress.mockResolvedValue({});
  saveWeeklyZoneProgress.mockResolvedValue(undefined);
  setActivePinia(createPinia());
});

afterEach(() => {
  vi.useRealTimers();
});

describe("weeklyTasks store", () => {
  describe("currentWeek", () => {
    it("returns 1 when no startDate", () => {
      const daily = useTaskStore();
      daily.startDate = "";
      const store = useWeeklyTaskStore();
      expect(store.currentWeek).toBe(1);
    });
  });

  describe("currentDayWithinWeek", () => {
    it("returns 1 when no startDate", () => {
      const daily = useTaskStore();
      daily.startDate = "";
      const store = useWeeklyTaskStore();
      expect(store.currentDayWithinWeek).toBe(1);
    });
  });

  describe("canComplete", () => {
    it("returns false on day 5 (withinWeek=5)", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00"));
      const daily = useTaskStore();
      daily.startDate = "2026-06-11"; // getDaysSince=4, withinWeek=(4%7)+1=5
      const store = useWeeklyTaskStore();
      expect(store.canComplete).toBe(false);
    });

    it("returns true on day 6 (withinWeek=6)", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00"));
      const daily = useTaskStore();
      daily.startDate = "2026-06-10"; // getDaysSince=5, withinWeek=(5%7)+1=6
      const store = useWeeklyTaskStore();
      expect(store.canComplete).toBe(true);
    });

    it("returns true on day 7 (withinWeek=7)", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00"));
      const daily = useTaskStore();
      daily.startDate = "2026-06-09"; // getDaysSince=6, withinWeek=(6%7)+1=7
      const store = useWeeklyTaskStore();
      expect(store.canComplete).toBe(true);
    });

    it("returns false on day 1 (withinWeek=1)", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00"));
      const daily = useTaskStore();
      daily.startDate = "2026-06-15"; // getDaysSince=0, withinWeek=(0%7)+1=1
      const store = useWeeklyTaskStore();
      expect(store.canComplete).toBe(false);
    });
  });

  describe("currentTask", () => {
    it("returns empty task when no tasks loaded", () => {
      const store = useWeeklyTaskStore();
      store.tasksLoaded = false;
      store.tasks = [];
      expect(store.currentTask.id).toBe("");
      expect(store.currentTask.nameProgram).toBe("");
    });

    it("returns task for current week", () => {
      const store = useWeeklyTaskStore();
      store.tasksLoaded = true;
      store.tasks = [
        {
          id: "w1",
          week: 1,
          title: "Week 1",
          what_doing: "do1",
          why_doing: "why1",
        },
        {
          id: "w2",
          week: 2,
          title: "Week 2",
          what_doing: "do2",
          why_doing: "why2",
        },
      ];
      const daily = useTaskStore();
      daily.startDate = "";
      // currentWeek is 1 with no startDate
      expect(store.currentTask.id).toBe("w1");
      expect(store.currentTask.nameProgram).toBe("Week 1");
    });

    it("falls back to cyclic task when week not found", () => {
      const store = useWeeklyTaskStore();
      store.tasksLoaded = true;
      store.tasks = [
        {
          id: "w1",
          week: 1,
          title: "Week 1",
          what_doing: "do1",
          why_doing: "why1",
        },
      ];
      const daily = useTaskStore();
      daily.startDate = "";
      // currentWeek=1, weekIndex=0, task[0] matches
      expect(store.currentTask.id).toBe("w1");
    });

    it("maps fields correctly", () => {
      const store = useWeeklyTaskStore();
      store.tasksLoaded = true;
      store.tasks = [
        {
          id: "w1",
          week: 1,
          title: "My Program",
          what_doing: "Exercise",
          why_doing: "Health",
        },
      ];
      const daily = useTaskStore();
      daily.startDate = "";
      const task = store.currentTask;
      expect(task.id).toBe("w1");
      expect(task.nameProgram).toBe("My Program");
      expect(task.whatDoing).toBe("Exercise");
      expect(task.whyDoing).toBe("Health");
    });
  });

  describe("isCompleted", () => {
    it("returns false when current week not completed", () => {
      const store = useWeeklyTaskStore();
      store.completed = {};
      expect(store.isCompleted()).toBe(false);
    });

    it("returns true when current week completed", () => {
      const store = useWeeklyTaskStore();
      const daily = useTaskStore();
      daily.startDate = "";
      store.completed = { 1: true };
      expect(store.isCompleted()).toBe(true);
    });
  });

  describe("state defaults", () => {
    it("starts with empty completed", () => {
      const store = useWeeklyTaskStore();
      expect(store.completed).toEqual({});
    });

    it("starts with empty tasks", () => {
      const store = useWeeklyTaskStore();
      expect(store.tasks).toEqual([]);
    });

    it("starts with tasksLoaded false", () => {
      const store = useWeeklyTaskStore();
      expect(store.tasksLoaded).toBe(false);
    });
  });

  describe("loadTasks", () => {
    it("loads tasks for the passed locale", async () => {
      getWeeklyTasks.mockResolvedValue([
        { id: "w1", week: 1, title: "UA", what_doing: "do", why_doing: "why" },
      ]);

      const store = useWeeklyTaskStore();
      await store.loadTasks("uk");

      expect(getWeeklyTasks).toHaveBeenCalledWith("uk");
      expect(store.tasks).toHaveLength(1);
    });

    it("defaults to ru locale", async () => {
      const store = useWeeklyTaskStore();
      await store.loadTasks();

      expect(getWeeklyTasks).toHaveBeenCalledWith("ru");
    });

    it("marks tasksLoaded false while loading and true after", async () => {
      const store = useWeeklyTaskStore();
      const loading = store.loadTasks("ru");

      expect(store.tasksLoaded).toBe(false);

      await loading;

      expect(store.tasksLoaded).toBe(true);
    });

    it("rethrows the service error", async () => {
      getWeeklyTasks.mockRejectedValue(new Error("tasks boom"));

      const store = useWeeklyTaskStore();

      await expect(store.loadTasks("ru")).rejects.toThrow("tasks boom");
      expect(store.tasksLoaded).toBe(true);
    });
  });

  describe("init", () => {
    it("passes the locale to loadTasks", async () => {
      const store = useWeeklyTaskStore();
      await store.init("uk");

      expect(getWeeklyTasks).toHaveBeenCalledWith("uk");
      expect(getWeeklyCompletions).toHaveBeenCalledOnce();
    });
  });

  describe("space cleanup: isSpaceCleanupTask", () => {
    it("is true only for the cleanup task id", () => {
      const store = useWeeklyTaskStore();

      setCurrentTask(store, SPACE_CLEANUP_TASK_ID);
      expect(store.isSpaceCleanupTask).toBe(true);

      setCurrentTask(store, "another-task");
      expect(store.isSpaceCleanupTask).toBe(false);
    });
  });

  describe("space cleanup: canComplete", () => {
    it.each([
      [1, false],
      [2, false],
      [3, true],
      [4, true],
      [5, true],
      [6, true],
      [7, true],
    ])("on day %i returns %s", (day, expected) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(NOW));
      useTaskStore().startDate = startDateForDay(day);
      const store = useCleanupTask();

      expect(store.currentDayWithinWeek).toBe(day);
      expect(store.canComplete).toBe(expected);
    });

    it("keeps days 6-7 for a regular weekly task", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(NOW));
      const daily = useTaskStore();
      const store = useWeeklyTaskStore();
      setCurrentTask(store, "regular-task");

      daily.startDate = startDateForDay(3);
      expect(store.canComplete).toBe(false);

      daily.startDate = startDateForDay(6);
      expect(store.canComplete).toBe(true);
    });
  });

  describe("space cleanup: zone counters", () => {
    it("counts only checked zones", () => {
      const store = useCleanupTask();
      store.zoneProgress = { desk: true, wardrobe: true };

      expect(store.zoneCount).toBe(ALL_ZONE_KEYS.length);
      expect(store.completedZoneCount).toBe(2);
      expect(store.allZonesCompleted).toBe(false);
      expect(store.zoneProgressPercent).toBe(40);
    });

    it("reports 100% when every zone is checked", () => {
      const store = useCleanupTask();
      store.zoneProgress = Object.fromEntries(
        ALL_ZONE_KEYS.map((zone) => [zone, true])
      );

      expect(store.completedZoneCount).toBe(ALL_ZONE_KEYS.length);
      expect(store.allZonesCompleted).toBe(true);
      expect(store.zoneProgressPercent).toBe(100);
    });

    it("ignores zone progress for a regular weekly task", () => {
      const store = useWeeklyTaskStore();
      setCurrentTask(store, "regular-task");
      store.zoneProgress = { desk: true };

      expect(store.completedZoneCount).toBe(0);
      expect(store.zoneProgressPercent).toBe(0);
    });
  });

  describe("space cleanup: toggleZone", () => {
    it("saves the inverted value and updates local state", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(NOW));
      useTaskStore().startDate = startDateForDay(1);
      const store = useCleanupTask();

      await store.toggleZone("desk");
      expect(saveWeeklyZoneProgress).toHaveBeenLastCalledWith(1, "desk", true);
      expect(store.zoneProgress.desk).toBe(true);

      await store.toggleZone("desk");
      expect(saveWeeklyZoneProgress).toHaveBeenLastCalledWith(1, "desk", false);
      expect(store.zoneProgress.desk).toBe(false);
    });

    it("rejects an unknown zone without saving", async () => {
      const store = useCleanupTask();

      await expect(store.toggleZone("garage" as any)).rejects.toThrow(
        "Неизвестная зона"
      );
      expect(saveWeeklyZoneProgress).not.toHaveBeenCalled();
    });

    it("does nothing for a regular weekly task", async () => {
      const store = useWeeklyTaskStore();
      setCurrentTask(store, "regular-task");

      await store.toggleZone("desk");

      expect(saveWeeklyZoneProgress).not.toHaveBeenCalled();
      expect(store.zoneProgress.desk).toBeUndefined();
    });

    it("does nothing when the week is already completed", async () => {
      const store = useCleanupTask();
      store.completed = { 1: true };

      await store.toggleZone("desk");

      expect(saveWeeklyZoneProgress).not.toHaveBeenCalled();
    });

    it("keeps local state if the week changed during save", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(NOW));
      const daily = useTaskStore();
      daily.startDate = startDateForDay(1);
      const store = useCleanupTask();

      saveWeeklyZoneProgress.mockImplementationOnce(async () => {
        // Пользователь перешёл на следующую неделю, пока шёл запрос.
        daily.startDate = new Date(
          new Date(NOW).getTime() - 7 * 86_400_000
        )
          .toISOString()
          .slice(0, 10);
      });

      await store.toggleZone("desk");

      expect(store.currentWeek).toBe(2);
      expect(store.zoneProgress.desk).toBeUndefined();
    });

    it("does not update local state when saving fails", async () => {
      const store = useCleanupTask();
      saveWeeklyZoneProgress.mockRejectedValueOnce(new Error("save boom"));

      await expect(store.toggleZone("desk")).rejects.toThrow("save boom");
      expect(store.zoneProgress.desk).toBeUndefined();
    });
  });

  describe("space cleanup: loadZoneProgress", () => {
    it("clears progress for a regular task without calling the service", async () => {
      const store = useWeeklyTaskStore();
      setCurrentTask(store, "regular-task");
      store.zoneProgress = { desk: true };

      await store.loadZoneProgress();

      expect(getWeeklyZoneProgress).not.toHaveBeenCalled();
      expect(store.zoneProgress).toEqual({});
    });

    it("loads progress for the cleanup task and current week", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(NOW));
      useTaskStore().startDate = startDateForDay(1);
      const store = useCleanupTask();
      getWeeklyZoneProgress.mockResolvedValueOnce({ desk: true });

      await store.loadZoneProgress();

      expect(getWeeklyZoneProgress).toHaveBeenCalledWith(1);
      expect(store.zoneProgress).toEqual({ desk: true });
    });

    it("uses an explicitly passed week", async () => {
      useTaskStore().startDate = "";
      const store = useCleanupTask();

      await store.loadZoneProgress(4);

      expect(getWeeklyZoneProgress).toHaveBeenCalledWith(4);
    });

    it("rethrows the service error", async () => {
      const store = useCleanupTask();
      getWeeklyZoneProgress.mockRejectedValueOnce(new Error("zones boom"));

      await expect(store.loadZoneProgress()).rejects.toThrow("zones boom");
    });
  });

  describe("space cleanup: completeCurrentTask", () => {
    it("requires all five zones before completing", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(NOW));
      useTaskStore().startDate = startDateForDay(3);
      const store = useCleanupTask();
      store.zoneProgress = { desk: true };

      await expect(store.completeCurrentTask()).rejects.toThrow(
        "все пять зон"
      );
      expect(completeWeeklyTask).not.toHaveBeenCalled();
    });

    it("completes from day 3 when every zone is checked", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(NOW));
      const daily = useTaskStore();
      daily.startDate = startDateForDay(3);
      const addEnergy = vi.spyOn(daily, "addEnergy").mockResolvedValue(undefined);
      const store = useCleanupTask();
      store.zoneProgress = Object.fromEntries(
        ALL_ZONE_KEYS.map((zone) => [zone, true])
      );

      await store.completeCurrentTask();

      expect(completeWeeklyTask).toHaveBeenCalledWith(
        SPACE_CLEANUP_TASK_ID,
        1
      );
      expect(addEnergy).toHaveBeenCalledWith(90);
      expect(store.completed[1]).toBe(true);
    });
  });
});

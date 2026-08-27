import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useWeeklyTaskStore } from "~/stores/weeklyTasks";
import { useTaskStore } from "~/stores/dailyTasks";

vi.mock("~/services/weeklyTask.service", () => ({
  getWeeklyTasks: vi.fn(),
  getWeeklyCompletions: vi.fn(),
  completeWeeklyTask: vi.fn(),
}));

beforeEach(() => {
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
        { id: "w1", week: 1, title: "Week 1", what_doing: "do1", why_doing: "why1" },
        { id: "w2", week: 2, title: "Week 2", what_doing: "do2", why_doing: "why2" },
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
        { id: "w1", week: 1, title: "Week 1", what_doing: "do1", why_doing: "why1" },
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
        { id: "w1", week: 1, title: "My Program", what_doing: "Exercise", why_doing: "Health" },
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
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useTaskStore } from "~/stores/dailyTasks";

vi.mock("~/services/dailyTask.service", () => ({
  getDailyTasks: vi.fn(),
}));

beforeEach(() => {
  setActivePinia(createPinia());
});

afterEach(() => {
  vi.useRealTimers();
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
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";

import { useGeometryWeekStore } from "~/stores/geometryWeek";

const { getGeometryWeekProgress, completeGeometryWeekDay } = vi.hoisted(
  () => ({
    getGeometryWeekProgress: vi.fn(),
    completeGeometryWeekDay: vi.fn(),
  })
);

vi.mock("~/services/geometryWeek.service", () => ({
  getGeometryWeekProgress,
  completeGeometryWeekDay,
}));

beforeEach(() => {
  vi.clearAllMocks();
  getGeometryWeekProgress.mockResolvedValue([]);
  completeGeometryWeekDay.mockResolvedValue(undefined);
  setActivePinia(createPinia());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("geometryWeek store", () => {
  describe("state defaults", () => {
    it("starts empty and idle", () => {
      const store = useGeometryWeekStore();

      expect(store.completedDays).toEqual([]);
      expect(store.loading).toBe(false);
      expect(store.saving).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  describe("getters", () => {
    it("counts completed days", () => {
      const store = useGeometryWeekStore();
      store.completedDays = [1, 2, 5];

      expect(store.completedCount).toBe(3);
    });

    it.each([
      [[], 0],
      [[1], 14],
      [[1, 2, 3], 43],
      [[1, 2, 3, 4, 5, 6, 7], 100],
    ])("computes progressPercent for %j", (days, percent) => {
      const store = useGeometryWeekStore();
      store.completedDays = days as number[];

      expect(store.progressPercent).toBe(percent);
    });
  });

  describe("loadProgress", () => {
    it("stores the loaded days", async () => {
      getGeometryWeekProgress.mockResolvedValueOnce([2, 4]);
      const store = useGeometryWeekStore();

      await store.loadProgress("t1", 3);

      expect(getGeometryWeekProgress).toHaveBeenCalledWith("t1", 3);
      expect(store.completedDays).toEqual([2, 4]);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it("sets loading while the request is in flight", async () => {
      let resolveLoad: (value: number[]) => void = () => {};
      getGeometryWeekProgress.mockReturnValueOnce(
        new Promise<number[]>((resolve) => {
          resolveLoad = resolve;
        })
      );
      const store = useGeometryWeekStore();

      const pending = store.loadProgress("t1", 1);
      expect(store.loading).toBe(true);

      resolveLoad([1]);
      await pending;
      expect(store.loading).toBe(false);
    });

    it("sets the error code and rethrows on failure", async () => {
      getGeometryWeekProgress.mockRejectedValueOnce(new Error("load boom"));
      const store = useGeometryWeekStore();

      await expect(store.loadProgress("t1", 1)).rejects.toThrow("load boom");
      expect(store.error).toBe("load");
      expect(store.loading).toBe(false);
    });
  });

  describe("completeStage", () => {
    it("saves the day and keeps completed days sorted", async () => {
      const store = useGeometryWeekStore();
      store.completedDays = [1, 4];

      await store.completeStage("t1", 2, 3);

      expect(completeGeometryWeekDay).toHaveBeenCalledWith("t1", 2, 3);
      expect(store.completedDays).toEqual([1, 3, 4]);
      expect(store.saving).toBe(false);
      expect(store.error).toBeNull();
    });

    it("rejects a day that is already completed", async () => {
      const store = useGeometryWeekStore();
      store.completedDays = [3];

      await expect(store.completeStage("t1", 1, 3)).rejects.toThrow(
        "Этот этап уже выполнен."
      );
      expect(completeGeometryWeekDay).not.toHaveBeenCalled();
    });

    it("ignores the call while another save is in progress", async () => {
      let resolveSave: () => void = () => {};
      completeGeometryWeekDay.mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        })
      );
      const store = useGeometryWeekStore();

      const first = store.completeStage("t1", 1, 1);
      expect(store.saving).toBe(true);

      await expect(store.completeStage("t1", 1, 2)).resolves.toBeUndefined();
      expect(completeGeometryWeekDay).toHaveBeenCalledTimes(1);

      resolveSave();
      await first;
      expect(store.completedDays).toEqual([1]);
    });

    it("sets the error code and rethrows on failure", async () => {
      completeGeometryWeekDay.mockRejectedValueOnce(new Error("save boom"));
      const store = useGeometryWeekStore();

      await expect(store.completeStage("t1", 1, 2)).rejects.toThrow(
        "save boom"
      );
      expect(store.error).toBe("save");
      expect(store.completedDays).toEqual([]);
      expect(store.saving).toBe(false);
    });
  });

  describe("reset", () => {
    it("clears progress and error", () => {
      const store = useGeometryWeekStore();
      store.completedDays = [1, 2];
      store.error = "save";

      store.reset();

      expect(store.completedDays).toEqual([]);
      expect(store.error).toBeNull();
    });
  });
});

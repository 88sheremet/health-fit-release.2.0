import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useJournalStore } from "~/stores/journal";
import type { JournalEntry } from "~/interfaces/JournalEntry.interface";

vi.mock("#imports", () => ({
  useSupabaseClient: vi.fn(),
}));

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("journal store", () => {
  describe("chartData", () => {
    it("returns empty array when no entries", () => {
      const store = useJournalStore();
      expect(store.chartData).toEqual([]);
    });

    it("sorts entries by date ascending", () => {
      const store = useJournalStore();
      store.entries = [
        { id: "3", date: "2026-06-15", mood: 3, note: "" },
        { id: "1", date: "2026-06-13", mood: 5, note: "" },
        { id: "2", date: "2026-06-14", mood: 1, note: "" },
      ];
      const dates = store.chartData.map((e) => e.date);
      expect(dates).toEqual(["2026-06-13", "2026-06-14", "2026-06-15"]);
    });

    it("assigns sequential day numbers", () => {
      const store = useJournalStore();
      store.entries = [
        { id: "1", date: "2026-06-13", mood: 5, note: "" },
        { id: "2", date: "2026-06-14", mood: 1, note: "" },
      ];
      const days = store.chartData.map((e) => e.day);
      expect(days).toEqual([1, 2]);
    });

    it("preserves mood, date, and note fields", () => {
      const store = useJournalStore();
      store.entries = [
        { id: "1", date: "2026-06-13", mood: 4, note: "great day" },
      ];
      const chart = store.chartData[0];
      expect(chart.mood).toBe(4);
      expect(chart.date).toBe("2026-06-13");
      expect(chart.note).toBe("great day");
    });

    it("does not mutate original entries array", () => {
      const store = useJournalStore();
      const entries: JournalEntry[] = [
        { id: "2", date: "2026-06-14", mood: 2, note: "" },
        { id: "1", date: "2026-06-13", mood: 5, note: "" },
      ];
      store.entries = entries;
      store.chartData;
      expect(entries[0].date).toBe("2026-06-14");
    });
  });

  describe("lastEntry", () => {
    it("returns null when entries is empty", () => {
      const store = useJournalStore();
      expect(store.lastEntry).toBeNull();
    });

    it("returns the last entry in the array", () => {
      const store = useJournalStore();
      store.entries = [
        { id: "1", date: "2026-06-13", mood: 5, note: "" },
        { id: "2", date: "2026-06-14", mood: 3, note: "ok" },
      ];
      expect(store.lastEntry?.id).toBe("2");
    });
  });

  describe("closeCheckin", () => {
    it("sets showCheckin to false", () => {
      const store = useJournalStore();
      store.showCheckin = true;
      store.closeCheckin();
      expect(store.showCheckin).toBe(false);
    });
  });

  describe("getEntryByDate", () => {
    it("returns matching entry", () => {
      const store = useJournalStore();
      store.entries = [
        { id: "1", date: "2026-06-13", mood: 5, note: "" },
        { id: "2", date: "2026-06-14", mood: 3, note: "" },
      ];
      expect(store.getEntryByDate("2026-06-14")?.id).toBe("2");
    });

    it("returns undefined when no match", () => {
      const store = useJournalStore();
      store.entries = [
        { id: "1", date: "2026-06-13", mood: 5, note: "" },
      ];
      expect(store.getEntryByDate("2026-06-99")).toBeUndefined();
    });
  });
});

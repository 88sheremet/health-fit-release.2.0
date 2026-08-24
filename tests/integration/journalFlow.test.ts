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

describe("journal flow integration", () => {
  it("populates entries and chartData sorts by date", () => {
    const store = useJournalStore();
    store.entries = [
      { id: "3", date: "2026-06-17", mood: 2, note: "tough day" },
      { id: "1", date: "2026-06-15", mood: 5, note: "great" },
      { id: "2", date: "2026-06-16", mood: 4, note: "good" },
    ];

    const chart = store.chartData;
    expect(chart.map((c) => c.date)).toEqual([
      "2026-06-15",
      "2026-06-16",
      "2026-06-17",
    ]);
    expect(chart.map((c) => c.day)).toEqual([1, 2, 3]);
    expect(chart.map((c) => c.mood)).toEqual([5, 4, 2]);
  });

  it("lastEntry returns the most recently added entry", () => {
    const store = useJournalStore();
    store.entries = [
      { id: "1", date: "2026-06-15", mood: 5, note: "" },
      { id: "2", date: "2026-06-16", mood: 3, note: "ok" },
    ];
    expect(store.lastEntry?.id).toBe("2");
  });

  it("lastEntry is null on empty entries", () => {
    const store = useJournalStore();
    expect(store.lastEntry).toBeNull();
  });

  it("getEntryByDate finds entry, closeCheckin toggles", () => {
    const store = useJournalStore();
    store.entries = [
      { id: "1", date: "2026-06-15", mood: 5, note: "great" },
      { id: "2", date: "2026-06-16", mood: 3, note: "" },
    ];

    expect(store.getEntryByDate("2026-06-15")?.mood).toBe(5);
    expect(store.getEntryByDate("2026-06-99")).toBeUndefined();

    store.showCheckin = true;
    store.closeCheckin();
    expect(store.showCheckin).toBe(false);
  });

  it("chartData with entries all same date", () => {
    const store = useJournalStore();
    store.entries = [
      { id: "1", date: "2026-06-15", mood: 5, note: "a" },
      { id: "2", date: "2026-06-15", mood: 3, note: "b" },
    ];
    const chart = store.chartData;
    expect(chart).toHaveLength(2);
    expect(chart[0].day).toBe(1);
    expect(chart[1].day).toBe(2);
  });

  it("chartData handles notes correctly", () => {
    const store = useJournalStore();
    store.entries = [
      { id: "1", date: "2026-06-15", mood: 4, note: "Walked in the park" },
      { id: "2", date: "2026-06-16", note: "" },
    ];
    const chart = store.chartData;
    expect(chart[0].note).toBe("Walked in the park");
    expect(chart[1].note).toBe("");
    expect(chart[1].mood).toBeUndefined();
  });
});

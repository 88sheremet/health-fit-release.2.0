import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useJournalStore } from "~/stores/journal";
import { useSupabaseClient } from "../setup";

let mockGetUser: ReturnType<typeof vi.fn>;
let mockUpsert: ReturnType<typeof vi.fn>;
let mockDelete: ReturnType<typeof vi.fn>;
let selectResult: any;

function setupSupabaseClient(user: any) {
  mockGetUser = vi.fn().mockResolvedValue({ data: { user }, error: null });

  mockUpsert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockImplementation(() =>
        Promise.resolve({ data: selectResult, error: null }),
      ),
    }),
  });

  mockDelete = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  });

  const client = {
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === "journal_entries") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: selectResult, error: null })),
            })),
          })),
          upsert: mockUpsert,
          delete: mockDelete,
        };
      }
      return {};
    }),
  };

  vi.mocked(useSupabaseClient).mockReturnValue(client as any);
}

beforeEach(() => {
  setActivePinia(createPinia());
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("journal flow integration", () => {
  it("loadEntries writes rows into state and chartData sorts them by date", async () => {
    selectResult = [
      { id: "e1", date: "2026-06-17", mood: 2, note: "tough day" },
      { id: "e2", date: "2026-06-15", mood: 5, note: "great" },
      { id: "e3", date: "2026-06-16", mood: null, note: "note only" },
    ];
    setupSupabaseClient({ id: "u1" });

    const store = useJournalStore();
    await store.loadEntries();

    expect(store.entries).toHaveLength(3);
    expect(store.getEntryByDate("2026-06-16")?.mood).toBeUndefined();
    expect(store.chartData.map((c) => c.date)).toEqual([
      "2026-06-15",
      "2026-06-16",
      "2026-06-17",
    ]);
    expect(store.chartData.map((c) => c.day)).toEqual([1, 2, 3]);
  });

  it("saveCheckin writes through Supabase and getters see the new row", async () => {
    selectResult = { id: "e-new", date: "2026-06-15", mood: 4, note: "good" };
    setupSupabaseClient({ id: "u1" });
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));

    const store = useJournalStore();
    await store.saveCheckin({ mood: 4, note: "good" });

    expect(mockUpsert).toHaveBeenCalledWith(
      { user_id: "u1", date: "2026-06-15", mood: 4, note: "good" },
      { onConflict: "user_id,date" },
    );
    expect(store.getEntryByDate("2026-06-15")?.mood).toBe(4);
    expect(store.showCheckin).toBe(false);
    expect(store.chartData[0]).toMatchObject({ date: "2026-06-15", mood: 4, note: "good" });
  });

  it("addNote upserts a note-only row and mood stays undefined", async () => {
    selectResult = { id: "e-note", date: "2026-06-15", mood: null, note: "hello" };
    setupSupabaseClient({ id: "u1" });
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));

    const store = useJournalStore();
    await store.addNote("hello");

    expect(mockUpsert).toHaveBeenCalledWith(
      { user_id: "u1", date: "2026-06-15", mood: null, note: "hello" },
      { onConflict: "user_id,date" },
    );
    expect(store.getEntryByDate("2026-06-15")?.note).toBe("hello");
    expect(store.getEntryByDate("2026-06-15")?.mood).toBeUndefined();
  });

  it("deleteEntry removes the row so lastEntry/chartData update", async () => {
    selectResult = [];
    setupSupabaseClient({ id: "u1" });

    const store = useJournalStore();
    store.entries = [
      { id: "e1", date: "2026-06-15", mood: 5, note: "a" },
      { id: "e2", date: "2026-06-16", mood: 3, note: "b" },
    ];

    await store.deleteEntry("e1");

    expect(mockDelete).toHaveBeenCalled();
    expect(store.lastEntry?.id).toBe("e2");
    expect(store.chartData.map((c) => c.date)).toEqual(["2026-06-16"]);
  });
});
